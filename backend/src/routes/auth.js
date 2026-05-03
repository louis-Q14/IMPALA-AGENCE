const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { sendSMS, generateOTP, normalizePhone, maskPhone } = require("../services/smsService");
const { generateEmailToken, sendVerificationEmail } = require("../services/emailService");

const router = express.Router();
const SALT_ROUNDS = 12;

// Configure multer for per-user file storage
const UPLOADS_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    // Temporary destination — file will be moved to user folder after user creation
    const tmpDir = path.join(UPLOADS_DIR, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    cb(null, tmpDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, uniqueName);
  },
});

const fileFilter = (_req, file, cb) => {
  const allowedTypes = ["image/jpeg", "image/png"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Format non accepté. Seuls JPG et PNG sont autorisés."), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

// POST /api/auth/register
router.post("/register", upload.single("piece_identite"), async (req, res) => {
  try {
    const {
      email, password, full_name, phone, role, services,
      nom, post_nom, prenom, date_naissance, lieu_naissance,
      sexe, nationalite, etat_civil, profession, nom_etablissement,
      type_piece, numero_piece, adresse, phone_fixe,
    } = req.body;

    if (!email || !password || !full_name) {
      return res.status(400).json({ error: "Email, mot de passe et nom requis" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
    }

    if (role === "pro" && (!nom_etablissement || nom_etablissement.trim().length < 2)) {
      return res.status(400).json({ error: "Le nom de l'établissement est obligatoire pour un compte Professionnel." });
    }

    const normalizedTypePiece = (type_piece || "").trim();
    const normalizedNumeroPiece = (numero_piece || "").trim().toUpperCase();
    const isCarteElecteurValid = normalizedTypePiece === "carte_electeur" && /^\d{11}$/.test(normalizedNumeroPiece);
    const isPasseportValid = normalizedTypePiece === "passeport" && /^[A-Z]{2}\d{7}$/.test(normalizedNumeroPiece);

    const isVisiteur = role === "visiteur";

    if (!isVisiteur) {
      if (!normalizedTypePiece || !["carte_electeur", "passeport"].includes(normalizedTypePiece)) {
        return res.status(400).json({ error: "Type de pièce invalide. Choisissez carte_electeur ou passeport." });
      }

      if (!isCarteElecteurValid && !isPasseportValid) {
        return res.status(400).json({
          error:
            normalizedTypePiece === "carte_electeur"
              ? "Le numéro de carte d'électeur doit contenir exactement 11 chiffres."
              : "Le numéro de passeport doit avoir 2 lettres majuscules suivies de 7 chiffres.",
        });
      }
    }

    // Check existing user
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      // Clean up temp file if any
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const userResult = await db.query(
      `INSERT INTO users (
        email, password_hash, full_name, phone, role,
        nom, post_nom, prenom, date_naissance, lieu_naissance,
        sexe, nationalite, etat_civil, profession, nom_etablissement,
        numero_piece, adresse, phone_fixe
      )
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
       RETURNING id, email, full_name, phone, role,
                nom, post_nom, prenom, date_naissance, lieu_naissance,
                sexe, nationalite, etat_civil, profession, nom_etablissement,
                numero_piece, adresse, phone_fixe, created_at`,
      [
        email, password_hash, full_name, phone || null, ["user", "pro", "visiteur"].includes(role) ? role : "user",
        nom || null, post_nom || null, prenom || null,
        date_naissance || null, lieu_naissance || null,
        sexe || null, nationalite || null, etat_civil || null, profession || null, nom_etablissement || null,
        normalizedNumeroPiece || null, adresse || null, phone_fixe || null,
      ]
    );
    const user = userResult.rows[0];

    // Create user folder for documents
    const userDir = path.join(UPLOADS_DIR, "users", user.id);
    fs.mkdirSync(userDir, { recursive: true });

    // Update user documents_path
    await db.query("UPDATE users SET documents_path = $1 WHERE id = $2", [
      `/uploads/users/${user.id}`, user.id,
    ]);

    // Move uploaded file to user folder
    if (req.file) {
      const destPath = path.join(userDir, req.file.filename);
      fs.renameSync(req.file.path, destPath);

      const fileUrl = `/uploads/users/${user.id}/${req.file.filename}`;
      await db.query("UPDATE users SET piece_identite_url = $1 WHERE id = $2", [fileUrl, user.id]);

      // Record in user_documents
      await db.query(
        `INSERT INTO user_documents (user_id, document_type, file_name, original_name, file_path, mime_type, file_size)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [user.id, "piece_identite", req.file.filename, req.file.originalname, fileUrl, req.file.mimetype, req.file.size]
      );
    }

    // Register selected services
    let parsedServices = services;
    if (typeof services === "string") {
      try { parsedServices = JSON.parse(services); } catch { parsedServices = []; }
    }
    if (parsedServices && Array.isArray(parsedServices)) {
      for (const service of parsedServices) {
        await db.query(
          `INSERT INTO user_services (user_id, service_type, subscription_status) VALUES ($1, $2, 'pending')`,
          [user.id, service]
        );
      }
    }

    // Generate OTP and send via SMS
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    const normalizedPhone = normalizePhone(phone || "");

    await db.query(
      `UPDATE users SET phone_otp = $1, phone_otp_expires = $2, phone_otp_sent_at = NOW() WHERE id = $3`,
      [otp, otpExpires, user.id]
    );

    try {
      await sendSMS(
        normalizedPhone || phone,
        `Votre code de vérification IMPALA-AGENCE est : ${otp}. Valide 10 minutes.`
      );
    } catch (smsErr) {
      console.error("SMS send error:", smsErr.message);
      // Don't block registration if SMS fails — OTP still readable in dev logs
    }

    // Generate email verification token and send email
    const emailToken = generateEmailToken();
    const emailTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
    await db.query(
      `UPDATE users SET email_token = $1, email_token_expires = $2 WHERE id = $3`,
      [emailToken, emailTokenExpires, user.id]
    );
    try {
      await sendVerificationEmail(email, full_name, emailToken);
    } catch (emailErr) {
      console.error("Email send error:", emailErr.message);
    }

    res.status(201).json({
      requires_verification: true,
      user_id: user.id,
      phone_masked: maskPhone(phone || ""),
      email_masked: email.replace(/(.)(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.max(2, b.length)) + c),
    });
  } catch (err) {
    // Clean up temp file on error
    if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
    console.error("Register error:", err);
    res.status(500).json({ error: "Erreur lors de l'inscription" });
  }
});

// POST /api/auth/login
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis" });
    }

    const result = await db.query(
      `SELECT u.id, u.email, u.password_hash, u.full_name, u.phone, u.role,
              u.nom, u.post_nom, u.prenom, u.date_naissance, u.lieu_naissance,
              u.sexe, u.nationalite, u.etat_civil, u.profession,
              u.numero_piece, u.adresse, u.phone_fixe, u.created_at,
              COALESCE(
                json_agg(json_build_object('service', us.service_type, 'status', CASE WHEN us.subscription_status IN ('active', 'approved') THEN 'active' ELSE COALESCE(NULLIF(us.subscription_status, 'pending'), u.status, 'pending') END, 'startDate', us.subscription_start, 'endDate', us.subscription_end))
                FILTER (WHERE us.id IS NOT NULL), '[]'
              ) as services
       FROM users u
       LEFT JOIN user_services us ON u.id = us.user_id
       WHERE u.email = $1
       GROUP BY u.id`,
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role, full_name: user.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, access_token: token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

// GET /api/auth/verify-email/:token
// Verifies a user's email address via the token sent by email → activates account
router.get("/verify-email/:token", async (req, res) => {
  try {
    const { token } = req.params;
    if (!token || token.length !== 64) {
      return res.status(400).json({ error: "Token invalide" });
    }

    const result = await db.query(
      `SELECT id, email, full_name, role, email_verified, email_token_expires
       FROM users WHERE email_token = $1`,
      [token]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Lien invalide ou déjà utilisé" });
    }

    const user = result.rows[0];

    if (user.email_verified) {
      return res.status(400).json({ error: "Email déjà vérifié" });
    }
    if (new Date() > new Date(user.email_token_expires)) {
      return res.status(400).json({ error: "Lien expiré. Créez un nouveau compte ou contactez le support." });
    }

    // Activate account via email verification
    await db.query(
      `UPDATE users
       SET email_verified = TRUE, status = 'approved', is_verified = TRUE,
           email_token = NULL, email_token_expires = NULL
       WHERE id = $1`,
      [user.id]
    );

    // Fetch full user for token
    const fullResult = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.status, u.is_verified,
              u.nom, u.post_nom, u.prenom, u.adresse, u.created_at,
              COALESCE(
                json_agg(json_build_object('service', us.service_type, 'status', us.subscription_status))
                FILTER (WHERE us.id IS NOT NULL), '[]'
              ) as services
       FROM users u
       LEFT JOIN user_services us ON u.id = us.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [user.id]
    );
    const fullUser = fullResult.rows[0];

    const jwtToken = jwt.sign(
      { userId: fullUser.id, email: fullUser.email, role: fullUser.role, full_name: fullUser.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ success: true, user: fullUser, access_token: jwtToken });
  } catch (err) {
    console.error("Verify-email error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/send-otp
// Resend OTP to the user's phone (rate-limited: 1 per 60 seconds)
router.post("/send-otp", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id requis" });

    const result = await db.query(
      "SELECT id, phone, phone_otp_sent_at, phone_verified FROM users WHERE id = $1",
      [user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });

    const user = result.rows[0];
    if (user.phone_verified) return res.status(400).json({ error: "Numéro déjà vérifié" });

    // Rate limit: 1 OTP per 60 seconds
    if (user.phone_otp_sent_at) {
      const secondsSinceLast = (Date.now() - new Date(user.phone_otp_sent_at).getTime()) / 1000;
      if (secondsSinceLast < 60) {
        return res.status(429).json({
          error: `Veuillez attendre ${Math.ceil(60 - secondsSinceLast)} secondes avant de renvoyer`,
        });
      }
    }

    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000);
    await db.query(
      `UPDATE users SET phone_otp = $1, phone_otp_expires = $2, phone_otp_sent_at = NOW() WHERE id = $3`,
      [otp, otpExpires, user_id]
    );

    const normalizedPhone = normalizePhone(user.phone || "");
    try {
      await sendSMS(
        normalizedPhone || user.phone,
        `Votre code de vérification IMPALA-AGENCE est : ${otp}. Valide 10 minutes.`
      );
    } catch (smsErr) {
      console.error("SMS resend error:", smsErr.message);
    }

    res.json({ success: true, message: "Code envoyé", phone_masked: maskPhone(user.phone || "") });
  } catch (err) {
    console.error("Send-OTP error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/verify-otp
// Verify OTP → activate account → return JWT
router.post("/verify-otp", async (req, res) => {
  try {
    const { user_id, otp } = req.body;
    if (!user_id || !otp) return res.status(400).json({ error: "user_id et otp requis" });

    const result = await db.query(
      `SELECT id, email, full_name, role, phone, phone_otp, phone_otp_expires, phone_verified
       FROM users WHERE id = $1`,
      [user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });

    const user = result.rows[0];

    if (user.phone_verified) return res.status(400).json({ error: "Numéro déjà vérifié" });
    if (!user.phone_otp) return res.status(400).json({ error: "Aucun code en attente. Demandez un nouveau code." });
    if (new Date() > new Date(user.phone_otp_expires)) {
      return res.status(400).json({ error: "Code expiré. Demandez un nouveau code." });
    }
    if (user.phone_otp !== otp.trim()) {
      return res.status(400).json({ error: "Code incorrect" });
    }

    // Activate account
    await db.query(
      `UPDATE users
       SET phone_verified = TRUE, status = 'approved', is_verified = TRUE,
           phone_otp = NULL, phone_otp_expires = NULL
       WHERE id = $1`,
      [user_id]
    );

    // Fetch full user data for token
    const fullResult = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.status, u.is_verified,
              u.nom, u.post_nom, u.prenom, u.adresse, u.created_at,
              COALESCE(
                json_agg(json_build_object('service', us.service_type, 'status', us.subscription_status))
                FILTER (WHERE us.id IS NOT NULL), '[]'
              ) as services
       FROM users u
       LEFT JOIN user_services us ON u.id = us.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [user_id]
    );
    const fullUser = fullResult.rows[0];

    const token = jwt.sign(
      { userId: fullUser.id, email: fullUser.email, role: fullUser.role, full_name: fullUser.full_name },
      process.env.JWT_SECRET,
      { expiresIn: "30d" }
    );

    res.json({ user: fullUser, access_token: token });
  } catch (err) {
    console.error("Verify-OTP error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/request-service
// Allows an existing authenticated user to request adding a service to their account.
// The request is stored as pending for admin validation.
router.post("/request-service", authenticateToken, async (req, res) => {
  try {
    const { service } = req.body;
    const userId = req.user.userId;

    const validServices = ["real_estate", "auto", "trash", "poubelles", "nettoyage", "repassage", "demenagement"];
    if (!service || !validServices.includes(service)) {
      return res.status(400).json({ error: "Service invalide" });
    }

    // Check if service already exists for this user
    const existing = await db.query(
      "SELECT id, subscription_status FROM user_services WHERE user_id = $1 AND service_type = $2",
      [userId, service]
    );
    if (existing.rows.length > 0) {
      const status = existing.rows[0].subscription_status;
      if (status === "active") {
        return res.status(409).json({ error: "Vous avez déjà accès à ce service" });
      }
      return res.status(409).json({ error: "Une demande pour ce service est déjà en cours de traitement" });
    }

    // Add the service request as pending
    await db.query(
      "INSERT INTO user_services (user_id, service_type, subscription_status) VALUES ($1, $2, 'pending')",
      [userId, service]
    );

    res.json({ success: true, message: "Demande envoyée à l'administration pour validation" });
  } catch (err) {
    console.error("Request-service error:", err);
    res.status(500).json({ error: "Erreur lors de la demande" });
  }
});

// GET /api/auth/me
router.get("/me", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.role, u.is_verified, u.avatar_url,
              u.nom, u.post_nom, u.prenom, u.date_naissance, u.lieu_naissance,
              u.sexe, u.nationalite, u.etat_civil, u.profession,
              u.numero_piece, u.adresse, u.phone_fixe, u.created_at,
              COALESCE(json_agg(json_build_object('service', us.service_type, 'status', CASE WHEN us.subscription_status IN ('active', 'approved') THEN 'active' ELSE COALESCE(NULLIF(us.subscription_status, 'pending'), u.status, 'pending') END, 'startDate', us.subscription_start, 'endDate', us.subscription_end))
              FILTER (WHERE us.id IS NOT NULL), '[]') as services
       FROM users u
       LEFT JOIN user_services us ON u.id = us.user_id
       WHERE u.id = $1
       GROUP BY u.id`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Me error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/auth/stats
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const email = req.user.email;

    const [reRow, autoRow, rentalsRow, nettRow, repRow, demRow, msgRow, favRow] = await Promise.all([
      db.query(
        `SELECT COUNT(*) FILTER (WHERE status='active') AS active_ads, COALESCE(SUM(views),0) AS total_views FROM real_estate_ads WHERE user_id=$1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*) FILTER (WHERE status='active') AS active_ads, COALESCE(SUM(views),0) AS total_views FROM auto_ads WHERE user_id=$1`,
        [userId]
      ),
      db.query(
        `SELECT COUNT(*) AS count FROM auto_rentals ar JOIN auto_ads a ON ar.auto_ad_id=a.id WHERE a.user_id=$1 AND ar.status IN ('pending','confirmed')`,
        [userId]
      ),
      db.query(`SELECT status, date FROM nettoyage_client_bookings WHERE LOWER(email)=LOWER($1) LIMIT 1`, [email]),
      db.query(`SELECT status, date FROM repassage_client_bookings WHERE LOWER(email)=LOWER($1) LIMIT 1`, [email]),
      db.query(`SELECT status, date FROM demenagement_client_bookings WHERE LOWER(email)=LOWER($1) LIMIT 1`, [email]),
      db.query(
        `SELECT COUNT(*) AS count FROM messages m JOIN conversations c ON m.conversation_id=c.id WHERE (c.participant_1=$1 OR c.participant_2=$1) AND m.sender_id!=$1 AND m.read=false`,
        [userId]
      ).catch(() => ({ rows: [{ count: 0 }] })),
      db.query(`SELECT COUNT(*) AS count FROM favorites WHERE user_id=$1`, [userId]).catch(() => ({ rows: [{ count: 0 }] })),
    ]);

    const re = reRow.rows[0];
    const auto = autoRow.rows[0];
    const nett = nettRow.rows[0] || null;
    const rep = repRow.rows[0] || null;
    const dem = demRow.rows[0] || null;
    const totalAds = (parseInt(re.active_ads)||0) + (parseInt(auto.active_ads)||0);
    const totalViews = (parseInt(re.total_views)||0) + (parseInt(auto.total_views)||0);

    res.json({
      real_estate: { active_ads: parseInt(re.active_ads)||0, total_views: parseInt(re.total_views)||0 },
      auto: { active_ads: parseInt(auto.active_ads)||0, total_views: parseInt(auto.total_views)||0, rentals: parseInt(rentalsRow.rows[0].count)||0 },
      nettoyage: { date: nett?.date||null, status: nett?.status||null },
      repassage: { date: rep?.date||null, status: rep?.status||null },
      demenagement: { date: dem?.date||null, status: dem?.status||null },
      totals: { ads: totalAds, views: totalViews, messages: parseInt(msgRow.rows[0].count)||0, favorites: parseInt(favRow.rows[0].count)||0 },
    });
  } catch (err) {
    console.error("Stats error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
module.exports = router;

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");
const { generateOTP } = require("../services/smsService");
const { generateEmailToken, sendOTPEmail, sendVerificationEmail, sendResetPasswordOTPEmail } = require("../services/emailService");

const router = express.Router();
const SALT_ROUNDS = 12;
const GOOGLE_OAUTH_STATE_TTL_MS = 10 * 60 * 1000;
const googleOauthState = new Map();

function getBackendPublicUrl() {
  const configured = process.env.BACKEND_PUBLIC_URL;
  if (configured && configured.trim()) return configured.trim().replace(/\/$/, "");
  return `http://localhost:${process.env.PORT || 5000}`;
}

function getFrontendUrl() {
  return (process.env.FRONTEND_URL || "http://localhost:3000").trim().replace(/\/$/, "");
}

function getGoogleConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri = `${getBackendPublicUrl()}/api/auth/google/callback`;
  return { clientId, clientSecret, redirectUri };
}

function queueOauthState(state) {
  googleOauthState.set(state, Date.now());
  setTimeout(() => googleOauthState.delete(state), GOOGLE_OAUTH_STATE_TTL_MS);
}

function consumeOauthState(state) {
  const createdAt = googleOauthState.get(state);
  googleOauthState.delete(state);
  if (!createdAt) return false;
  return Date.now() - createdAt <= GOOGLE_OAUTH_STATE_TTL_MS;
}

function signAccessToken(user) {
  return jwt.sign(
    { userId: user.id, email: user.email, role: user.role, full_name: user.full_name },
    process.env.JWT_SECRET,
    { expiresIn: "30d" }
  );
}

async function getUserWithServicesById(userId) {
  const result = await db.query(
    `SELECT u.id, u.email, u.full_name, u.phone, u.role,
            u.nom, u.post_nom, u.prenom, u.date_naissance, u.lieu_naissance,
            u.sexe, u.nationalite, u.etat_civil, u.profession,
            u.numero_piece, u.adresse, u.phone_fixe, u.created_at,
            COALESCE(
              json_agg(json_build_object('service', us.service_type, 'status', CASE WHEN us.subscription_status IN ('active', 'approved') THEN 'active' ELSE COALESCE(NULLIF(us.subscription_status, 'pending'), u.status, 'pending') END, 'startDate', us.subscription_start, 'endDate', us.subscription_end))
              FILTER (WHERE us.id IS NOT NULL), '[]'
            ) as services
      FROM users u
      LEFT JOIN user_services us ON u.id = us.user_id
      WHERE u.id = $1
      GROUP BY u.id`,
    [userId]
  );
  return result.rows[0] || null;
}

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

    // Generate OTP and send via email
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await db.query(
      `UPDATE users SET phone_otp = $1, phone_otp_expires = $2, phone_otp_sent_at = NOW() WHERE id = $3`,
      [otp, otpExpires, user.id]
    );

    try {
      await sendOTPEmail(email, full_name, otp);
    } catch (emailErr) {
      console.error("OTP email send error:", emailErr.message);
      // Don't block registration if email fails
    }

    const emailMasked = email.replace(/(.)(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.max(2, b.length)) + c);

    res.status(201).json({
      requires_verification: true,
      user_id: user.id,
      email_masked: emailMasked,
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
       WHERE LOWER(u.email) = LOWER($1)
       GROUP BY u.id`,
      [email.trim()]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: "Identifiants incorrects" });
    }

    const token = signAccessToken(user);

    const { password_hash, ...safeUser } = user;
    res.json({ user: safeUser, access_token: token });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
});

// GET /api/auth/google/start
// Starts Google OAuth 2.0 authorization code flow
router.get("/google/start", async (_req, res) => {
  try {
    const { clientId, clientSecret, redirectUri } = getGoogleConfig();
    if (!clientId || !clientSecret) {
      return res.status(500).json({ error: "Configuration Google OAuth manquante" });
    }

    const state = crypto.randomBytes(24).toString("hex");
    queueOauthState(state);

    const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
    authUrl.searchParams.set("client_id", clientId);
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("scope", "openid email profile");
    authUrl.searchParams.set("access_type", "offline");
    authUrl.searchParams.set("prompt", "select_account");
    authUrl.searchParams.set("state", state);

    return res.redirect(authUrl.toString());
  } catch (err) {
    console.error("Google start error:", err);
    return res.status(500).json({ error: "Impossible de démarrer la connexion Google" });
  }
});

// GET /api/auth/google/callback
// Handles Google OAuth callback, upserts user, then redirects to frontend with token
router.get("/google/callback", async (req, res) => {
  const frontendUrl = getFrontendUrl();
  const redirectWithError = (message) =>
    res.redirect(`${frontendUrl}/connexion?oauth_error=${encodeURIComponent(message)}`);

  try {
    const { code, state } = req.query;
    if (!code || !state || !consumeOauthState(String(state))) {
      return redirectWithError("Session Google invalide, veuillez réessayer.");
    }

    const { clientId, clientSecret, redirectUri } = getGoogleConfig();
    if (!clientId || !clientSecret) {
      return redirectWithError("Configuration Google OAuth manquante.");
    }

    const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }).toString(),
    });

    if (!tokenRes.ok) {
      const details = await tokenRes.text();
      console.error("Google token exchange failed:", details);
      return redirectWithError("Connexion Google refusée.");
    }

    const tokenData = await tokenRes.json();
    const accessToken = tokenData.access_token;
    if (!accessToken) {
      return redirectWithError("Token Google invalide.");
    }

    const profileRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!profileRes.ok) {
      const details = await profileRes.text();
      console.error("Google userinfo failed:", details);
      return redirectWithError("Impossible de récupérer le profil Google.");
    }

    const profile = await profileRes.json();
    const email = (profile.email || "").toLowerCase().trim();
    const fullName = (profile.name || "Utilisateur Google").trim();
    const googleId = profile.sub;
    const emailVerified = Boolean(profile.email_verified);

    if (!googleId || !email) {
      return redirectWithError("Profil Google incomplet.");
    }
    if (!emailVerified) {
      return redirectWithError("Votre email Google doit être vérifié.");
    }

    const existing = await db.query(
      `SELECT id FROM users WHERE google_id = $1 OR LOWER(email) = LOWER($2) LIMIT 1`,
      [googleId, email]
    );

    let userId;
    if (existing.rows.length > 0) {
      userId = existing.rows[0].id;
      await db.query(
        `UPDATE users
         SET google_id = $1,
             full_name = COALESCE(NULLIF(full_name, ''), $2),
             email_verified = TRUE,
             is_verified = TRUE,
             status = 'approved'
         WHERE id = $3`,
        [googleId, fullName, userId]
      );
    } else {
      const generatedPassword = crypto.randomBytes(32).toString("hex");
      const passwordHash = await bcrypt.hash(generatedPassword, SALT_ROUNDS);

      const created = await db.query(
        `INSERT INTO users (email, password_hash, full_name, role, status, is_verified, email_verified, google_id)
         VALUES ($1, $2, $3, 'user', 'approved', TRUE, TRUE, $4)
         RETURNING id`,
        [email, passwordHash, fullName, googleId]
      );
      userId = created.rows[0].id;
    }

    const user = await getUserWithServicesById(userId);
    if (!user) {
      return redirectWithError("Compte introuvable après connexion Google.");
    }

    const appToken = signAccessToken(user);
    return res.redirect(`${frontendUrl}/connexion?google_token=${encodeURIComponent(appToken)}`);
  } catch (err) {
    console.error("Google callback error:", err);
    return redirectWithError("Erreur pendant la connexion Google.");
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
// Resend OTP to the user's email (rate-limited: 1 per 60 seconds)
router.post("/send-otp", async (req, res) => {
  try {
    const { user_id } = req.body;
    if (!user_id) return res.status(400).json({ error: "user_id requis" });

    const result = await db.query(
      "SELECT id, email, full_name, phone_otp_sent_at, phone_verified FROM users WHERE id = $1",
      [user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });

    const user = result.rows[0];
    if (user.phone_verified) return res.status(400).json({ error: "Compte déjà vérifié" });

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

    try {
      await sendOTPEmail(user.email, user.full_name, otp);
    } catch (emailErr) {
      console.error("OTP resend error:", emailErr.message);
      return res.status(500).json({ error: "Impossible d'envoyer le code. Réessayez." });
    }

    const emailMasked = user.email.replace(/(.)(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.max(2, b.length)) + c);
    res.json({ success: true, message: "Code envoyé", email_masked: emailMasked });
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

// POST /api/auth/forgot-password
// Send a 6-digit OTP code to the user's email for password reset
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });

    const result = await db.query(
      "SELECT id, full_name, reset_token_expires FROM users WHERE LOWER(email) = LOWER($1)",
      [email.trim()]
    );

    const emailMasked = email.trim().replace(/(.)(.*)(@.*)/, (_, a, b, c) => a + "*".repeat(Math.max(2, b.length)) + c);

    // Always return 200 to avoid email enumeration
    if (result.rows.length === 0) {
      return res.json({ success: true, email_masked: emailMasked });
    }

    const user = result.rows[0];

    // Rate limit: 1 OTP per 2 minutes
    if (user.reset_token_expires) {
      const secondsLeft = (new Date(user.reset_token_expires).getTime() - Date.now()) / 1000;
      if (secondsLeft > 58 * 60) {
        return res.status(429).json({ error: "Veuillez attendre 2 minutes avant de demander un nouveau code." });
      }
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await db.query(
      "UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3",
      [otp, expires, user.id]
    );

    try {
      await sendResetPasswordOTPEmail(email.trim(), user.full_name, otp);
    } catch (emailErr) {
      console.error("Reset OTP email error:", emailErr.message);
    }

    res.json({ success: true, email_masked: emailMasked });
  } catch (err) {
    console.error("Forgot-password error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/auth/reset-password
// Validate OTP and set new password
router.post("/reset-password", async (req, res) => {
  try {
    const { email, otp, password } = req.body;
    if (!email || !otp || !password) return res.status(400).json({ error: "Email, code et mot de passe requis" });
    if (password.length < 8) return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });

    const result = await db.query(
      "SELECT id FROM users WHERE LOWER(email) = LOWER($1) AND reset_token = $2 AND reset_token_expires > NOW()",
      [email.trim(), otp.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(400).json({ error: "Code invalide ou expiré. Faites une nouvelle demande." });
    }

    const hashed = await bcrypt.hash(password, SALT_ROUNDS);
    await db.query(
      "UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2",
      [hashed, result.rows[0].id]
    );

    res.json({ success: true, message: "Mot de passe mis à jour avec succès." });
  } catch (err) {
    console.error("Reset-password error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

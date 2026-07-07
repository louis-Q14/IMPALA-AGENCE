const express = require("express");
const router = express.Router();
const db = require("../db");
const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { authenticateToken } = require("../middleware/auth");

const AD_TYPES = ["real_estate", "auto"];

// ─── Media upload setup ───────────────────────────────────────────────────────
const MEDIA_DIR = path.join(__dirname, "../../uploads/messages");
if (!fs.existsSync(MEDIA_DIR)) fs.mkdirSync(MEDIA_DIR, { recursive: true });

const mediaStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, MEDIA_DIR),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const mediaUpload = multer({
  storage: mediaStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (_req, file, cb) => {
    const allowed = [
      "image/", "video/", "audio/",
      "application/pdf", "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/zip", "text/plain",
    ];
    const ok = allowed.some(t => file.mimetype.startsWith(t) || file.mimetype === t);
    ok ? cb(null, true) : cb(new Error("Type de fichier non supporté"), false);
  },
});

function getMediaType(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  if (mimetype.startsWith("audio/")) return "audio";
  return "file";
}

// ─── Helper ───────────────────────────────────────────────────────────────────
async function findOrCreateConversation({ userA, userB, adId = null, adType = null }) {
  const params = [userA, userB];
  let where = `((participant_1 = $1 AND participant_2 = $2) OR (participant_1 = $2 AND participant_2 = $1))`;
  if (adId) { params.push(adId); where += ` AND ad_id = $${params.length}`; }
  else { where += ` AND ad_id IS NULL`; }
  const existing = await db.query(`SELECT * FROM conversations WHERE ${where} LIMIT 1`, params);
  if (existing.rows.length) return existing.rows[0];
  const ins = await db.query(
    `INSERT INTO conversations (ad_id, ad_type, participant_1, participant_2) VALUES ($1,$2,$3,$4) RETURNING *`,
    [adId, adType, userA, userB]
  );
  return ins.rows[0];
}

async function getAdOwner(adId, adType) {
  const table = adType === "auto" ? "auto_ads" : "real_estate_ads";
  const r = await db.query(`SELECT id, user_id, title FROM ${table} WHERE id = $1`, [adId]);
  return r.rows[0] || null;
}

// ─── CONVERSATIONS ────────────────────────────────────────────────────────────

// GET /api/messages/conversations
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { archived } = req.query;
    const archFilter = archived === "1"
      ? `AND ((c.participant_1=$1 AND c.archived_by_1=TRUE) OR (c.participant_2=$1 AND c.archived_by_2=TRUE))`
      : `AND ((c.participant_1=$1 AND COALESCE(c.archived_by_1,FALSE)=FALSE) OR (c.participant_2=$1 AND COALESCE(c.archived_by_2,FALSE)=FALSE))`;
    const r = await db.query(
      `SELECT c.id, c.ad_id, c.ad_type, c.created_at,
              c.archived_by_1, c.archived_by_2,
              CASE WHEN c.participant_1=$1 THEN c.participant_2 ELSE c.participant_1 END AS other_id,
              u.full_name AS other_name, u.email AS other_email, u.avatar_url AS other_avatar,
              (SELECT content FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT media_type FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) AS last_media_type,
              (SELECT created_at FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) AS last_message_time,
              (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id=c.id AND m.sender_id<>$1 AND m.read=FALSE AND m.deleted_at IS NULL) AS unread_count
       FROM conversations c
       JOIN users u ON u.id=(CASE WHEN c.participant_1=$1 THEN c.participant_2 ELSE c.participant_1 END)
       WHERE (c.participant_1=$1 OR c.participant_2=$1) ${archFilter}
       ORDER BY last_message_time DESC NULLS LAST, c.created_at DESC`,
      [me]
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/messages/conversations/:id/messages
router.get("/conversations/:id/messages", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const conv = await db.query(
      `SELECT * FROM conversations WHERE id=$1 AND (participant_1=$2 OR participant_2=$2)`,
      [req.params.id, me]
    );
    if (!conv.rows.length) return res.status(404).json({ error: "Conversation introuvable" });

    const msgs = await db.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.read, m.created_at,
              m.media_url, m.media_type, m.deleted_at, m.reply_to_id,
              u.full_name AS sender_name,
              rm.content AS reply_content, rm.media_type AS reply_media_type,
              ru.full_name AS reply_sender_name
       FROM messages m
       JOIN users u ON u.id=m.sender_id
       LEFT JOIN messages rm ON rm.id=m.reply_to_id
       LEFT JOIN users ru ON ru.id=rm.sender_id
       WHERE m.conversation_id=$1
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );

    await db.query(
      `UPDATE messages SET read=TRUE WHERE conversation_id=$1 AND sender_id<>$2 AND read=FALSE AND deleted_at IS NULL`,
      [req.params.id, me]
    );

    res.json(msgs.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/messages/conversations/:id/messages  (text)
router.post("/conversations/:id/messages", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { content, reply_to_id } = req.body;
    if (!content?.trim()) return res.status(400).json({ error: "Message vide" });
    if (content.length > 5000) return res.status(400).json({ error: "Message trop long" });

    const conv = await db.query(
      `SELECT * FROM conversations WHERE id=$1 AND (participant_1=$2 OR participant_2=$2)`,
      [req.params.id, me]
    );
    if (!conv.rows.length) return res.status(404).json({ error: "Conversation introuvable" });

    const ins = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content, reply_to_id)
       VALUES ($1,$2,$3,$4) RETURNING id, conversation_id, sender_id, content, read, created_at, reply_to_id`,
      [req.params.id, me, content.trim(), reply_to_id || null]
    );
    res.status(201).json({ ...ins.rows[0], sender_name: req.user.full_name });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/messages/conversations/:id/media  (file/image/video/audio upload)
router.post("/conversations/:id/media", authenticateToken, mediaUpload.single("file"), async (req, res) => {
  try {
    const me = req.user.userId;
    const conv = await db.query(
      `SELECT * FROM conversations WHERE id=$1 AND (participant_1=$2 OR participant_2=$2)`,
      [req.params.id, me]
    );
    if (!conv.rows.length) { if (req.file) fs.unlinkSync(req.file.path); return res.status(404).json({ error: "Conversation introuvable" }); }
    if (!req.file) return res.status(400).json({ error: "Aucun fichier" });

    const mediaUrl = `/uploads/messages/${req.file.filename}`;
    const mediaType = getMediaType(req.file.mimetype);
    const caption = req.body.caption || "";

    const ins = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content, media_url, media_type)
       VALUES ($1,$2,$3,$4,$5) RETURNING id, conversation_id, sender_id, content, media_url, media_type, read, created_at`,
      [req.params.id, me, caption, mediaUrl, mediaType]
    );
    res.status(201).json({ ...ins.rows[0], sender_name: req.user.full_name, original_name: req.file.originalname, file_size: req.file.size });
  } catch (err) {
    if (req.file) fs.unlinkSync(req.file.path).catch?.(() => {});
    console.error(err);
    res.status(500).json({ error: "Erreur upload" });
  }
});

// DELETE /api/messages/messages/:id  (soft delete — only own messages)
router.delete("/messages/:id", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const r = await db.query(
      `UPDATE messages SET deleted_at=NOW(), content='[Message supprimé]' WHERE id=$1 AND sender_id=$2 RETURNING id`,
      [req.params.id, me]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Message introuvable ou non autorisé" });
    res.json({ success: true, id: r.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/messages/conversations/:id/archive
router.patch("/conversations/:id/archive", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { archive } = req.body; // true = archive, false = unarchive
    const conv = await db.query(
      `SELECT * FROM conversations WHERE id=$1 AND (participant_1=$2 OR participant_2=$2)`,
      [req.params.id, me]
    );
    if (!conv.rows.length) return res.status(404).json({ error: "Conversation introuvable" });
    const c = conv.rows[0];
    const field = c.participant_1 === me ? "archived_by_1" : "archived_by_2";
    await db.query(`UPDATE conversations SET ${field}=$1 WHERE id=$2`, [!!archive, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/messages/conversations/:id
router.delete("/conversations/:id", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const r = await db.query(
      `DELETE FROM conversations WHERE id=$1 AND (participant_1=$2 OR participant_2=$2) RETURNING id`,
      [req.params.id, me]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Conversation introuvable" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/messages/users/search?q=
router.get("/users/search", authenticateToken, async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const me = req.user.userId;
    const params = [me];
    let where = `id<>$1`;
    if (q) { params.push(`%${q}%`); where += ` AND (full_name ILIKE $2 OR email ILIKE $2)`; }
    const r = await db.query(
      `SELECT id, full_name, email, avatar_url FROM users WHERE ${where} ORDER BY full_name ASC LIMIT 20`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/messages/contact-seller
router.post("/contact-seller", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { adId, adType, content } = req.body;
    if (!adId || !adType || !content?.trim()) return res.status(400).json({ error: "Paramètres manquants" });
    if (!AD_TYPES.includes(adType)) return res.status(400).json({ error: "Type invalide" });
    const ad = await getAdOwner(adId, adType);
    if (!ad) return res.status(404).json({ error: "Annonce introuvable" });
    if (ad.user_id === me) return res.status(400).json({ error: "Vous ne pouvez pas vous contacter vous-même" });
    const conv = await findOrCreateConversation({ userA: me, userB: ad.user_id, adId, adType });
    const ins = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1,$2,$3) RETURNING id, conversation_id, sender_id, content, read, created_at`,
      [conv.id, me, content.trim()]
    );
    res.status(201).json({ conversation_id: conv.id, message: { ...ins.rows[0], sender_name: req.user.full_name } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/messages/contact-guest — owner contacts a guest about their booking
router.post("/contact-guest", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { bookingId, content } = req.body;
    if (!bookingId || !content?.trim()) return res.status(400).json({ error: "bookingId et content requis" });

    const bookRow = await db.query(
      `SELECT b.guest_id, b.property_id, p.user_id AS owner_id, p.title
       FROM reservation_bookings b
       JOIN reservation_properties p ON p.id = b.property_id
       WHERE b.id = $1`,
      [bookingId]
    );
    if (!bookRow.rows[0]) return res.status(404).json({ error: "Réservation introuvable" });
    const booking = bookRow.rows[0];

    if (booking.owner_id !== me) return res.status(403).json({ error: "Accès refusé" });
    if (booking.guest_id === me) return res.status(400).json({ error: "Vous ne pouvez pas vous contacter vous-même" });

    const conv = await findOrCreateConversation({
      userA: me, userB: booking.guest_id,
      adId: booking.property_id, adType: "reservation",
    });

    const ins = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1,$2,$3)
       RETURNING id, conversation_id, sender_id, content, read, created_at`,
      [conv.id, me, content.trim()]
    );

    res.status(201).json({
      conversation_id: conv.id,
      message: { ...ins.rows[0], sender_name: req.user.full_name },
      property_title: booking.title,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/messages/contact-host
router.post("/contact-host", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { propertyId, content } = req.body;
    if (!propertyId || !content?.trim()) return res.status(400).json({ error: "propertyId et content requis" });
    const propRow = await db.query(`SELECT user_id, title FROM reservation_properties WHERE id=$1`, [propertyId]);
    if (!propRow.rows[0]) return res.status(404).json({ error: "Bien introuvable" });
    const ownerId = propRow.rows[0].user_id;
    if (ownerId === me) return res.status(400).json({ error: "Vous ne pouvez pas vous contacter vous-même" });
    const conv = await findOrCreateConversation({ userA: me, userB: ownerId, adId: propertyId, adType: "reservation" });
    const ins = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1,$2,$3) RETURNING id, conversation_id, sender_id, content, read, created_at`,
      [conv.id, me, content.trim()]
    );
    res.status(201).json({ conversation_id: conv.id, message: { ...ins.rows[0], sender_name: req.user.full_name }, property_title: propRow.rows[0].title });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/messages/reservation-conversations
router.get("/reservation-conversations", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const r = await db.query(
      `SELECT c.id, c.ad_id AS property_id, c.ad_type, c.created_at,
              c.archived_by_1, c.archived_by_2,
              CASE WHEN c.participant_1=$1 THEN c.participant_2 ELSE c.participant_1 END AS other_id,
              u.full_name AS other_name, u.email AS other_email, u.avatar_url AS other_avatar,
              rp.title AS property_title, rp.city AS property_city,
              (SELECT image_url FROM reservation_property_images WHERE property_id=rp.id AND is_cover=TRUE LIMIT 1) AS property_cover,
              (SELECT content FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT media_type FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) AS last_media_type,
              (SELECT created_at FROM messages m WHERE m.conversation_id=c.id AND m.deleted_at IS NULL ORDER BY m.created_at DESC LIMIT 1) AS last_message_time,
              (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id=c.id AND m.sender_id<>$1 AND m.read=FALSE AND m.deleted_at IS NULL) AS unread_count
       FROM conversations c
       JOIN users u ON u.id=(CASE WHEN c.participant_1=$1 THEN c.participant_2 ELSE c.participant_1 END)
       LEFT JOIN reservation_properties rp ON rp.id=c.ad_id
       WHERE (c.participant_1=$1 OR c.participant_2=$1) AND c.ad_type='reservation'
       ORDER BY last_message_time DESC NULLS LAST, c.created_at DESC`,
      [me]
    );
    res.json(r.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

// Find or create a 1:1 conversation tied to an ad (or generic if ad omitted)
async function findOrCreateConversation({ userA, userB, adId = null, adType = null }) {
  const params = [userA, userB];
  let where = `((participant_1 = $1 AND participant_2 = $2) OR (participant_1 = $2 AND participant_2 = $1))`;
  if (adId) {
    params.push(adId);
    where += ` AND ad_id = $${params.length}`;
  } else {
    where += ` AND ad_id IS NULL`;
  }
  const existing = await db.query(`SELECT * FROM conversations WHERE ${where} LIMIT 1`, params);
  if (existing.rows.length) return existing.rows[0];

  const ins = await db.query(
    `INSERT INTO conversations (ad_id, ad_type, participant_1, participant_2)
     VALUES ($1, $2, $3, $4) RETURNING *`,
    [adId, adType, userA, userB]
  );
  return ins.rows[0];
}

// GET /api/messages/conversations
router.get("/conversations", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const r = await db.query(
      `SELECT c.id, c.ad_id, c.ad_type, c.created_at,
              CASE WHEN c.participant_1 = $1 THEN c.participant_2 ELSE c.participant_1 END AS other_id,
              u.full_name AS other_name, u.email AS other_email, u.avatar_url AS other_avatar,
              (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_time,
              (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> $1 AND m.read = FALSE) AS unread_count
       FROM conversations c
       JOIN users u ON u.id = (CASE WHEN c.participant_1 = $1 THEN c.participant_2 ELSE c.participant_1 END)
       WHERE c.participant_1 = $1 OR c.participant_2 = $1
       ORDER BY last_message_time DESC NULLS LAST, c.created_at DESC`,
      [me]
    );
    res.json(r.rows);
  } catch (err) {
    console.error("List conversations error:", err);
    res.status(500).json({ error: "Erreur lors du chargement des conversations" });
  }
});

// GET /api/messages/conversations/:id/messages
router.get("/conversations/:id/messages", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const conv = await db.query(
      `SELECT * FROM conversations WHERE id = $1 AND (participant_1 = $2 OR participant_2 = $2)`,
      [req.params.id, me]
    );
    if (!conv.rows.length) return res.status(404).json({ error: "Conversation introuvable" });

    const msgs = await db.query(
      `SELECT m.id, m.conversation_id, m.sender_id, m.content, m.read, m.created_at,
              u.full_name AS sender_name
       FROM messages m
       JOIN users u ON u.id = m.sender_id
       WHERE m.conversation_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.id]
    );

    // Mark received messages as read
    await db.query(
      `UPDATE messages SET read = TRUE WHERE conversation_id = $1 AND sender_id <> $2 AND read = FALSE`,
      [req.params.id, me]
    );

    res.json(msgs.rows);
  } catch (err) {
    console.error("List messages error:", err);
    res.status(500).json({ error: "Erreur lors du chargement des messages" });
  }
});

// POST /api/messages/conversations/:id/messages
router.post("/conversations/:id/messages", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { content } = req.body;
    if (!content || !content.trim()) return res.status(400).json({ error: "Message vide" });
    if (content.length > 5000) return res.status(400).json({ error: "Message trop long" });

    const conv = await db.query(
      `SELECT * FROM conversations WHERE id = $1 AND (participant_1 = $2 OR participant_2 = $2)`,
      [req.params.id, me]
    );
    if (!conv.rows.length) return res.status(404).json({ error: "Conversation introuvable" });

    const ins = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)
       RETURNING id, conversation_id, sender_id, content, read, created_at`,
      [req.params.id, me, content.trim()]
    );
    res.status(201).json({ ...ins.rows[0], sender_name: req.user.full_name });
  } catch (err) {
    console.error("Send message error:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi du message" });
  }
});

// POST /api/messages/contact-seller
// body: { adId, adType, content }
router.post("/contact-seller", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { adId, adType, content } = req.body;
    if (!adId || !adType || !content || !content.trim()) {
      return res.status(400).json({ error: "Paramètres manquants" });
    }
    if (!AD_TYPES.includes(adType)) {
      return res.status(400).json({ error: "Type d'annonce invalide" });
    }
    if (content.length > 5000) return res.status(400).json({ error: "Message trop long" });

    const ad = await getAdOwner(adId, adType);
    if (!ad) return res.status(404).json({ error: "Annonce introuvable" });
    if (ad.user_id === me) {
      return res.status(400).json({ error: "Vous ne pouvez pas vous contacter vous-même" });
    }

    const conv = await findOrCreateConversation({
      userA: me,
      userB: ad.user_id,
      adId,
      adType,
    });

    const ins = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)
       RETURNING id, conversation_id, sender_id, content, read, created_at`,
      [conv.id, me, content.trim()]
    );

    res.status(201).json({
      conversation_id: conv.id,
      message: { ...ins.rows[0], sender_name: req.user.full_name },
    });
  } catch (err) {
    console.error("Contact seller error:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi du message" });
  }
});

// POST /api/messages/conversations  (start direct conversation)
// body: { otherUserId }
router.post("/conversations", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: "Utilisateur requis" });
    if (otherUserId === me) return res.status(400).json({ error: "Destinataire invalide" });

    const u = await db.query(`SELECT id, full_name, email FROM users WHERE id = $1`, [otherUserId]);
    if (!u.rows.length) return res.status(404).json({ error: "Utilisateur introuvable" });

    const conv = await findOrCreateConversation({ userA: me, userB: otherUserId });
    res.status(201).json(conv);
  } catch (err) {
    console.error("Create conversation error:", err);
    res.status(500).json({ error: "Erreur lors de la création de la conversation" });
  }
});

// DELETE /api/messages/conversations/:id
router.delete("/conversations/:id", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const r = await db.query(
      `DELETE FROM conversations WHERE id = $1 AND (participant_1 = $2 OR participant_2 = $2) RETURNING id`,
      [req.params.id, me]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Conversation introuvable" });
    res.json({ success: true });
  } catch (err) {
    console.error("Delete conversation error:", err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

// DELETE /api/messages/messages/:id  (delete a single message — sender only)
router.delete("/messages/:id", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const r = await db.query(
      `DELETE FROM messages WHERE id = $1 AND sender_id = $2 RETURNING id, conversation_id`,
      [req.params.id, me]
    );
    if (!r.rows.length) return res.status(404).json({ error: "Message introuvable ou non autorisé" });
    res.json({ success: true, ...r.rows[0] });
  } catch (err) {
    console.error("Delete message error:", err);
    res.status(500).json({ error: "Erreur lors de la suppression du message" });
  }
});

// POST /api/messages/messages/:id/forward  body: { otherUserId }
router.post("/messages/:id/forward", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { otherUserId } = req.body;
    if (!otherUserId) return res.status(400).json({ error: "Destinataire requis" });
    if (otherUserId === me) return res.status(400).json({ error: "Destinataire invalide" });

    const src = await db.query(
      `SELECT m.id, m.content, m.conversation_id
       FROM messages m
       JOIN conversations c ON c.id = m.conversation_id
       WHERE m.id = $1 AND (c.participant_1 = $2 OR c.participant_2 = $2)`,
      [req.params.id, me]
    );
    if (!src.rows.length) return res.status(404).json({ error: "Message introuvable" });

    const u = await db.query(`SELECT id FROM users WHERE id = $1`, [otherUserId]);
    if (!u.rows.length) return res.status(404).json({ error: "Utilisateur introuvable" });

    const conv = await findOrCreateConversation({ userA: me, userB: otherUserId });
    const ins = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)
       RETURNING id, conversation_id, sender_id, content, read, created_at`,
      [conv.id, me, src.rows[0].content]
    );
    res.status(201).json({
      conversation_id: conv.id,
      message: { ...ins.rows[0], sender_name: req.user.full_name },
    });
  } catch (err) {
    console.error("Forward message error:", err);
    res.status(500).json({ error: "Erreur lors du transfert" });
  }
});

// GET /api/messages/users/search?q=
router.get("/users/search", authenticateToken, async (req, res) => {
  try {
    const q = (req.query.q || "").toString().trim();
    const me = req.user.userId;
    const params = [me];
    let where = `id <> $1`;
    if (q) {
      params.push(`%${q}%`);
      where += ` AND (full_name ILIKE $2 OR email ILIKE $2)`;
    }
    const r = await db.query(
      `SELECT id, full_name, email, avatar_url FROM users WHERE ${where} ORDER BY full_name ASC LIMIT 20`,
      params
    );
    res.json(r.rows);
  } catch (err) {
    console.error("Search users error:", err);
    res.status(500).json({ error: "Erreur lors de la recherche" });
  }
});

// POST /api/messages/contact-host
// body: { bookingId?, propertyId, content }
// Creates or finds a conversation between a guest and the property owner
router.post("/contact-host", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const { propertyId, bookingId, content } = req.body;

    if (!propertyId || !content || !content.trim()) {
      return res.status(400).json({ error: "propertyId et content requis" });
    }
    if (content.length > 5000) return res.status(400).json({ error: "Message trop long" });

    // Get property owner
    const propRow = await db.query(
      `SELECT user_id, title FROM reservation_properties WHERE id = $1`,
      [propertyId]
    );
    if (!propRow.rows[0]) return res.status(404).json({ error: "Bien introuvable" });

    const ownerId = propRow.rows[0].user_id;
    if (ownerId === me) {
      return res.status(400).json({ error: "Vous ne pouvez pas vous contacter vous-même" });
    }

    const conv = await findOrCreateConversation({
      userA: me,
      userB: ownerId,
      adId: propertyId,
      adType: "reservation",
    });

    const ins = await db.query(
      `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)
       RETURNING id, conversation_id, sender_id, content, read, created_at`,
      [conv.id, me, content.trim()]
    );

    res.status(201).json({
      conversation_id: conv.id,
      message: { ...ins.rows[0], sender_name: req.user.full_name },
      property_title: propRow.rows[0].title,
    });
  } catch (err) {
    console.error("Contact host error:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi du message" });
  }
});

// GET /api/messages/reservation-conversations
// Returns all conversations of type 'reservation' for the current user
router.get("/reservation-conversations", authenticateToken, async (req, res) => {
  try {
    const me = req.user.userId;
    const r = await db.query(
      `SELECT c.id, c.ad_id AS property_id, c.ad_type, c.created_at,
              CASE WHEN c.participant_1 = $1 THEN c.participant_2 ELSE c.participant_1 END AS other_id,
              u.full_name AS other_name, u.email AS other_email, u.avatar_url AS other_avatar,
              rp.title AS property_title, rp.city AS property_city,
              (SELECT image_url FROM reservation_property_images WHERE property_id = rp.id AND is_cover = TRUE LIMIT 1) AS property_cover,
              (SELECT content FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message,
              (SELECT created_at FROM messages m WHERE m.conversation_id = c.id ORDER BY m.created_at DESC LIMIT 1) AS last_message_time,
              (SELECT COUNT(*)::int FROM messages m WHERE m.conversation_id = c.id AND m.sender_id <> $1 AND m.read = FALSE) AS unread_count
       FROM conversations c
       JOIN users u ON u.id = (CASE WHEN c.participant_1 = $1 THEN c.participant_2 ELSE c.participant_1 END)
       LEFT JOIN reservation_properties rp ON rp.id = c.ad_id
       WHERE (c.participant_1 = $1 OR c.participant_2 = $1)
         AND c.ad_type = 'reservation'
       ORDER BY last_message_time DESC NULLS LAST, c.created_at DESC`,
      [me]
    );
    res.json(r.rows);
  } catch (err) {
    console.error("Reservation conversations error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

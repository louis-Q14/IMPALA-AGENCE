const express = require("express");
const router = express.Router();
const rateLimit = require("express-rate-limit");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

// Rate limit: 3 posts per 10 min per IP
const postLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  max: 3,
  message: { error: "Trop d'envois. Réessayez dans 10 minutes." },
  standardHeaders: true,
  legacyHeaders: false,
});

// GET /api/blog/avis — list approved reviews (public)
router.get("/avis", async (req, res) => {
  try {
    const { page = 1, limit = 12 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const rows = await db.query(
      `SELECT a.id, a.auteur_nom, a.note, a.titre, a.contenu, a.created_at,
              u.avatar_url AS auteur_avatar
       FROM blog_avis a
       LEFT JOIN users u ON u.id = a.user_id
       WHERE a.status = 'approved'
       ORDER BY a.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM blog_avis WHERE status = 'approved'`
    );

    const statsResult = await db.query(
      `SELECT ROUND(AVG(note)::numeric, 1) AS moyenne, COUNT(*)::int AS total
       FROM blog_avis WHERE status = 'approved' AND note IS NOT NULL`
    );

    res.json({
      avis: rows.rows,
      total: countResult.rows[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
      stats: statsResult.rows[0],
    });
  } catch (err) {
    console.error("List avis error:", err);
    res.status(500).json({ error: "Erreur lors du chargement des avis" });
  }
});

// POST /api/blog/avis — submit a review (optional auth)
// If authenticated, auteur_nom and user_id are taken from the token
router.post("/avis", postLimiter, async (req, res) => {
  try {
    // Try to extract user from token if present (optional auth)
    let userId = null;
    let auteurNom = null;
    let auteurEmail = null;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith("Bearer ")) {
      try {
        const jwt = require("jsonwebtoken");
        const decoded = jwt.verify(authHeader.split(" ")[1], process.env.JWT_SECRET);
        userId = decoded.userId;
        const userRow = await db.query(
          `SELECT full_name, email FROM users WHERE id = $1`,
          [userId]
        );
        if (userRow.rows.length) {
          auteurNom = userRow.rows[0].full_name;
          auteurEmail = userRow.rows[0].email;
        }
      } catch {
        // Token invalid or expired — continue as anonymous
        userId = null;
      }
    }

    const { note, titre, contenu } = req.body;
    // For non-authenticated users, require nom
    if (!userId) {
      const { nom, email } = req.body;
      if (!nom || !nom.trim()) return res.status(400).json({ error: "Nom requis" });
      if (nom.length > 100) return res.status(400).json({ error: "Nom trop long" });
      auteurNom = nom.trim();
      auteurEmail = email ? email.trim().toLowerCase() : null;
    }

    if (!contenu || !contenu.trim()) return res.status(400).json({ error: "Avis requis" });
    if (contenu.length > 2000) return res.status(400).json({ error: "Avis trop long (max 2000 caractères)" });
    if (titre && titre.length > 150) return res.status(400).json({ error: "Titre trop long" });

    const noteVal = note ? parseInt(note) : null;
    if (noteVal !== null && (noteVal < 1 || noteVal > 5)) {
      return res.status(400).json({ error: "Note invalide (1-5)" });
    }

    const result = await db.query(
      `INSERT INTO blog_avis (user_id, auteur_nom, auteur_email, note, titre, contenu, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending')
       RETURNING id, created_at`,
      [userId, auteurNom, auteurEmail, noteVal, titre ? titre.trim() : null, contenu.trim()]
    );

    res.status(201).json({
      success: true,
      id: result.rows[0].id,
      message: "Votre avis a été soumis et sera visible après modération.",
    });
  } catch (err) {
    console.error("Post avis error:", err);
    res.status(500).json({ error: "Erreur lors de l'envoi de l'avis" });
  }
});

// --- Admin endpoints ---

// GET /api/blog/avis/admin — all reviews (admin only)
router.get("/avis/admin", authenticateToken, async (req, res) => {
  try {
    const allowedRoles = ["admin", "super_admin", "support_agent"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const { status, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    let where = "";

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      params.push(status);
      where = `WHERE a.status = $${params.length}`;
    }

    params.push(parseInt(limit), offset);
    const rows = await db.query(
      `SELECT a.id, a.auteur_nom, a.auteur_email, a.note, a.titre, a.contenu, a.status, a.created_at,
              u.full_name AS user_name
       FROM blog_avis a
       LEFT JOIN users u ON u.id = a.user_id
       ${where}
       ORDER BY a.created_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countResult = await db.query(
      `SELECT COUNT(*)::int AS total FROM blog_avis ${where}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      avis: rows.rows,
      total: countResult.rows[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (err) {
    console.error("Admin list avis error:", err);
    res.status(500).json({ error: "Erreur lors du chargement" });
  }
});

// PATCH /api/blog/avis/:id — approve or reject
router.patch("/avis/:id", authenticateToken, async (req, res) => {
  try {
    const allowedRoles = ["admin", "super_admin", "support_agent"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    const { status } = req.body;
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const result = await db.query(
      `UPDATE blog_avis SET status = $1 WHERE id = $2 RETURNING *`,
      [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Avis introuvable" });

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Update avis error:", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// DELETE /api/blog/avis/:id — admin delete
router.delete("/avis/:id", authenticateToken, async (req, res) => {
  try {
    const allowedRoles = ["admin", "super_admin"];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    await db.query(`DELETE FROM blog_avis WHERE id = $1`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    console.error("Delete avis error:", err);
    res.status(500).json({ error: "Erreur lors de la suppression" });
  }
});

module.exports = router;

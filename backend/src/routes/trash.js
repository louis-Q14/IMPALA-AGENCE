const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

// POST /api/trash/subscribe
router.post("/subscribe", authenticateToken, async (req, res) => {
  try {
    const { address, city, postal_code, frequency, waste_types, bins_count } = req.body;

    if (!address || !frequency || !waste_types || !Array.isArray(waste_types)) {
      return res.status(400).json({ error: "Adresse, fréquence et types de déchets requis" });
    }

    const priceMap = { weekly: 9, biweekly: 7, monthly: 5 };
    const monthly_price = (priceMap[frequency] || 9) * (bins_count || 1);

    // waste_types doit être un tableau PostgreSQL TEXT[] (pas du JSON)
    const result = await db.query(
      `INSERT INTO trash_subscriptions (user_id, address, city, postal_code, frequency, waste_types, bins_count, monthly_price)
       VALUES ($1, $2, $3, $4, $5, $6::text[], $7, $8) RETURNING *`,
      [req.user.userId, address, city || null, postal_code || null, frequency, waste_types, bins_count || 1, monthly_price]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Trash subscribe error:", err);
    res.status(500).json({ error: "Erreur lors de l'abonnement" });
  }
});

// GET /api/trash/subscription
router.get("/subscription", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT * FROM trash_subscriptions WHERE user_id = $1 AND status = 'active' ORDER BY created_at DESC LIMIT 1`,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Aucun abonnement actif" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Trash subscription error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/trash/schedule
router.get("/schedule", authenticateToken, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT tc.* FROM trash_collections tc
       JOIN trash_subscriptions ts ON tc.subscription_id = ts.id
       WHERE ts.user_id = $1 AND tc.scheduled_date >= CURRENT_DATE
       ORDER BY tc.scheduled_date ASC
       LIMIT 20`,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Trash schedule error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/trash/report-issue
router.post("/report-issue", authenticateToken, async (req, res) => {
  try {
    const { collection_id, issue_description } = req.body;

    await db.query(
      `UPDATE trash_collections SET status = 'reported', notes = $2 WHERE id = $1`,
      [collection_id, issue_description]
    );

    res.json({ message: "Problème signalé avec succès" });
  } catch (err) {
    console.error("Trash report error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================
// PUBLIC CONFIG ENDPOINTS (for client pricing pages)
// ============================================================

// GET /api/trash/config — plan config + global promo (no auth needed)
router.get("/config", async (_req, res) => {
  try {
    const result = await db.query("SELECT plan_config, global_promo FROM trash_global_config WHERE id = 1");
    if (result.rows.length === 0) {
      return res.json({ planConfig: null, globalPromo: null });
    }
    const row = result.rows[0];
    res.json({ planConfig: row.plan_config, globalPromo: row.global_promo });
  } catch (err) {
    console.error("Trash config error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/trash/my-discount — individual discount for logged-in user
router.get("/my-discount", authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query("SELECT email FROM users WHERE id = $1", [req.user.userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    const email = userResult.rows[0].email;

    const result = await db.query(
      "SELECT discount_type, percent, starts_at, ends_at FROM trash_discount_config WHERE LOWER(email) = LOWER($1) AND ends_at >= CURRENT_DATE",
      [email]
    );
    if (result.rows.length === 0) {
      return res.json({ discount: null });
    }
    const d = result.rows[0];
    res.json({
      discount: {
        type: d.discount_type,
        percent: d.percent,
        startsAt: d.starts_at,
        endsAt: d.ends_at,
      },
    });
  } catch (err) {
    console.error("Trash my-discount error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/trash/my-subscription — get my admin-managed subscription
router.get("/my-subscription", authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query("SELECT email FROM users WHERE id = $1", [req.user.userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    const email = userResult.rows[0].email;

    const result = await db.query(
      "SELECT * FROM trash_client_subs WHERE LOWER(email) = LOWER($1)",
      [email]
    );
    if (result.rows.length === 0) {
      return res.json({ subscription: null });
    }
    const s = result.rows[0];
    res.json({
      subscription: {
        plan: s.plan,
        frequency: s.frequency,
        bins: s.bins,
        amount: s.amount,
        status: s.status,
        collectDays: s.collect_days,
        zone: s.zone,
        address: s.address,
        startDate: s.start_date,
        nextPickup: s.next_pickup,
      },
    });
  } catch (err) {
    console.error("Trash my-subscription error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/trash/my-subscription/status — client can pause/reactivate/cancel
router.patch("/my-subscription/status", authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query("SELECT email FROM users WHERE id = $1", [req.user.userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    const email = userResult.rows[0].email;

    const { status } = req.body;
    if (!["paused", "cancelled"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide. Seul l'admin peut activer un compte." });
    }

    const result = await db.query(
      `UPDATE trash_client_subs SET status = $1, updated_at = NOW() WHERE LOWER(email) = LOWER($2) RETURNING *`,
      [status, email]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Aucun abonnement trouvé" });
    }
    res.json({ success: true, status: result.rows[0].status });
  } catch (err) {
    console.error("Trash update status error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/trash/my-subscription — create or update my own subscription
router.put("/my-subscription", authenticateToken, async (req, res) => {
  try {
    const userResult = await db.query("SELECT email, full_name FROM users WHERE id = $1", [req.user.userId]);
    if (userResult.rows.length === 0) return res.status(404).json({ error: "Utilisateur non trouvé" });
    const email = userResult.rows[0].email;
    const fullName = userResult.rows[0].full_name || req.body.fullName || "";

    const { plan, frequency, bins, amount, collectDays, zone, address, startDate, nextPickup } = req.body;

    const result = await db.query(
      `INSERT INTO trash_client_subs (email, full_name, plan, frequency, bins, amount, status, collect_days, zone, address, start_date, next_pickup, updated_at)
       VALUES (LOWER($1), $2, $3, $4, $5, $6, 'pending', $7, $8, $9, $10, $11, NOW())
       ON CONFLICT (email)
       DO UPDATE SET full_name = $2, plan = $3, frequency = $4, bins = $5, amount = $6, collect_days = $7, zone = $8, address = $9, start_date = $10, next_pickup = $11, updated_at = NOW()
       RETURNING *`,
      [email, fullName, plan || 'basic', frequency || '1x/semaine', bins || 1, amount || '15 $/mois', collectDays || [], zone || '', address || '', startDate || '', nextPickup || '']
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Trash upsert my-subscription error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

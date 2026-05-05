const express = require("express");
const db = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Middleware: admin only
router.use(authenticateToken, requireRole("admin"));

// GET /api/admin/stats
router.get("/stats", async (_req, res) => {
  try {
    const [users, reAds, autoAds, trashSubs, revenue] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users"),
      db.query("SELECT COUNT(*) FROM real_estate_ads"),
      db.query("SELECT COUNT(*) FROM auto_ads"),
      db.query("SELECT COUNT(*) FROM trash_subscriptions WHERE status = 'active'"),
      db.query("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid'"),
    ]);

    res.json({
      total_users: parseInt(users.rows[0].count),
      total_real_estate_ads: parseInt(reAds.rows[0].count),
      total_auto_ads: parseInt(autoAds.rows[0].count),
      active_trash_subscriptions: parseInt(trashSubs.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total),
    });
  } catch (err) {
    console.error("Admin stats error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/users
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 200 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.nom, u.post_nom, u.prenom,
              u.date_naissance, u.lieu_naissance, u.sexe, u.nationalite,
              u.etat_civil, u.profession, u.numero_piece, u.piece_identite_url,
              u.adresse, u.phone, u.phone_fixe, u.role, u.status, u.is_verified,
              u.created_at,
              COALESCE(
                json_agg(us.service_type) FILTER (WHERE us.id IS NOT NULL),
                '[]'
              ) as services,
              COALESCE(
                json_object_agg(us.service_type, COALESCE(us.subscription_status, 'pending'))
                FILTER (WHERE us.id IS NOT NULL),
                '{}'::json
              ) as service_status_map
       FROM users u
       LEFT JOIN user_services us ON u.id = us.user_id
       WHERE u.role NOT IN ('admin', 'super_admin', 'finance_agent', 'support_agent', 'trash_agent')
       GROUP BY u.id
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`,
      [parseInt(limit), offset]
    );

    res.json(result.rows);
  } catch (err) {
    console.error("Admin users error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/users/:id/status
router.patch("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const result = await db.query(
      "UPDATE users SET status = $1, is_verified = $2 WHERE id = $3 AND role NOT IN ('admin', 'super_admin', 'finance_agent', 'support_agent', 'trash_agent') RETURNING id, status",
      [status, status === "approved", id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Utilisateur non trouvé" });
    }

    // If approved and user has trash service, sync to trash subscriptions
    if (status === "approved") {
      const userResult = await db.query(
        `SELECT u.full_name, u.email, u.adresse,
                COALESCE(json_agg(us.service_type) FILTER (WHERE us.id IS NOT NULL), '[]') as services
         FROM users u
         LEFT JOIN user_services us ON u.id = us.user_id
         WHERE u.id = $1
         GROUP BY u.id`,
        [id]
      );
      if (userResult.rows.length > 0) {
        const user = userResult.rows[0];
        // Service sync can be handled client-side for localStorage-based services
      }
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Admin user status error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/ads/:type/:id/status
router.patch("/ads/:type/:id/status", async (req, res) => {
  try {
    const { type, id } = req.params;
    const { status } = req.body;

    if (!["active", "rejected", "pending"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const table = type === "real_estate" ? "real_estate_ads" : "auto_ads";
    await db.query(`UPDATE ${table} SET status = $1 WHERE id = $2`, [status, id]);

    res.json({ message: "Statut mis à jour" });
  } catch (err) {
    console.error("Admin ad status error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/pending-ads
router.get("/pending-ads", async (_req, res) => {
  try {
    const [reAds, autoAds] = await Promise.all([
      db.query(
        `SELECT r.id, r.title, r.city, r.created_at, 'real_estate' as type, u.full_name as author
         FROM real_estate_ads r JOIN users u ON r.user_id = u.id
         WHERE r.status = 'pending' ORDER BY r.created_at DESC LIMIT 20`
      ),
      db.query(
        `SELECT a.id, CONCAT(a.brand, ' ', a.model) as title, a.location_text as city, a.created_at, 'auto' as type, u.full_name as author
         FROM auto_ads a JOIN users u ON a.user_id = u.id
         WHERE a.status = 'pending' ORDER BY a.created_at DESC LIMIT 20`
      ),
    ]);

    const all = [...reAds.rows, ...autoAds.rows].sort(
      (a, b) => new Date(b.created_at) - new Date(a.created_at)
    );

    res.json(all);
  } catch (err) {
    console.error("Admin pending ads error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/admin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM users WHERE id = $1 AND role NOT IN ('admin', 'super_admin', 'finance_agent', 'support_agent', 'trash_agent')", [req.params.id]);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    console.error("Admin delete user error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================
// TRASH CONFIG & DISCOUNTS (admin only)
// ============================================================

// GET /api/admin/trash/config — plan config + global promo
router.get("/trash/config", async (_req, res) => {
  try {
    const result = await db.query("SELECT plan_config, global_promo FROM trash_global_config WHERE id = 1");
    if (result.rows.length === 0) {
      return res.json({ planConfig: null, globalPromo: null });
    }
    const row = result.rows[0];
    res.json({ planConfig: row.plan_config, globalPromo: row.global_promo });
  } catch (err) {
    console.error("Admin trash config error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/admin/trash/config — update plan config
router.put("/trash/config", async (req, res) => {
  try {
    const { planConfig } = req.body;
    if (!planConfig) return res.status(400).json({ error: "planConfig requis" });

    await db.query(
      `INSERT INTO trash_global_config (id, plan_config, updated_at)
       VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET plan_config = EXCLUDED.plan_config, updated_at = NOW()`,
      [JSON.stringify(planConfig)]
    );
    res.json({ message: "Configuration mise à jour" });
  } catch (err) {
    console.error("Admin trash config update error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/admin/trash/global-promo — set or clear global promotion
router.put("/trash/global-promo", async (req, res) => {
  try {
    const { globalPromo } = req.body; // null to clear
    await db.query(
      `INSERT INTO trash_global_config (id, global_promo, updated_at)
       VALUES (1, $1, NOW())
       ON CONFLICT (id) DO UPDATE SET global_promo = EXCLUDED.global_promo, updated_at = NOW()`,
      [globalPromo ? JSON.stringify(globalPromo) : null]
    );
    res.json({ message: "Promotion globale mise à jour" });
  } catch (err) {
    console.error("Admin global promo error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/trash/discounts — list all individual discounts
router.get("/trash/discounts", async (_req, res) => {
  try {
    const result = await db.query(
      "SELECT id, email, discount_type, percent, starts_at, ends_at FROM trash_discount_config ORDER BY created_at DESC"
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Admin trash discounts error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/admin/trash/discounts — set individual discount for a user by email
router.put("/trash/discounts", async (req, res) => {
  try {
    const { email, discountType, percent, startsAt, endsAt } = req.body;
    if (!email || !discountType || percent == null || !startsAt || !endsAt) {
      return res.status(400).json({ error: "Tous les champs sont requis" });
    }

    const result = await db.query(
      `INSERT INTO trash_discount_config (email, discount_type, percent, starts_at, ends_at, updated_at)
       VALUES (LOWER($1), $2, $3, $4, $5, NOW())
       ON CONFLICT (email)
       DO UPDATE SET discount_type = $2, percent = $3, starts_at = $4, ends_at = $5, updated_at = NOW()
       RETURNING *`,
      [email, discountType, percent, startsAt, endsAt]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Admin set discount error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/admin/trash/discounts/:email — remove individual discount
router.delete("/trash/discounts/:email", async (req, res) => {
  try {
    await db.query("DELETE FROM trash_discount_config WHERE LOWER(email) = LOWER($1)", [req.params.email]);
    res.json({ message: "Remise supprimée" });
  } catch (err) {
    console.error("Admin delete discount error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================
// ADMIN TRASH CLIENT SUBSCRIPTIONS
// ============================================================

// PUT /api/admin/trash/subscriptions — upsert a client subscription by email
router.put("/trash/subscriptions", async (req, res) => {
  try {
    const { email, fullName, plan, frequency, bins, amount, status, collectDays, zone, address, startDate, nextPickup } = req.body;
    if (!email) return res.status(400).json({ error: "Email requis" });

    const result = await db.query(
      `INSERT INTO trash_client_subs (email, full_name, plan, frequency, bins, amount, status, collect_days, zone, address, start_date, next_pickup, updated_at)
       VALUES (LOWER($1), $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())
       ON CONFLICT (email)
       DO UPDATE SET full_name = $2, plan = $3, frequency = $4, bins = $5, amount = $6, status = $7, collect_days = $8, zone = $9, address = $10, start_date = $11, next_pickup = $12, updated_at = NOW()
       RETURNING *`,
      [email, fullName || '', plan || 'basic', frequency || '1x/semaine', bins || 1, amount || '15 $/mois', status || 'active', collectDays || [], zone || '', address || '', startDate || '', nextPickup || '']
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Admin upsert subscription error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/trash/subscriptions — list all client subscriptions
router.get("/trash/subscriptions", async (_req, res) => {
  try {
    const result = await db.query("SELECT * FROM trash_client_subs ORDER BY updated_at DESC");
    res.json(result.rows);
  } catch (err) {
    console.error("Admin list subscriptions error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/admin/trash/subscriptions/:email — delete a client subscription
router.delete("/trash/subscriptions/:email", async (req, res) => {
  try {
    const { email } = req.params;
    await db.query("DELETE FROM trash_client_subs WHERE LOWER(email) = LOWER($1)", [email]);
    res.json({ message: "Abonnement supprimé" });
  } catch (err) {
    console.error("Admin delete subscription error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================
// HELPERS — generic booking CRUD factory
// ============================================================
function makeServiceRoutes(service, tableName, configTable, discountTable, extraFields) {
  // GET bookings — b.* first so user columns override nulls from empty LEFT JOIN
  router.get(`/${service}/bookings`, async (_req, res) => {
    try {
      const result = await db.query(
        `SELECT b.*,
                u.id::text as user_id,
                u.email,
                u.full_name,
                u.adresse,
                COALESCE(b.status, 'pending') as status,
                TO_CHAR(us.subscription_start, 'DD/MM/YYYY') as start_date
         FROM user_services us
         JOIN users u ON us.user_id = u.id
         LEFT JOIN ${tableName} b ON LOWER(b.email) = LOWER(u.email)
         WHERE us.service_type = $1
         ORDER BY b.created_at DESC NULLS LAST`,
        [service]
      );
      res.json(result.rows);
    } catch (err) {
      console.error(`Admin ${service} bookings error:`, err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // PUT bookings — upsert booking details + update status in user_services
  router.put(`/${service}/bookings`, async (req, res) => {
    try {
      const body = req.body;
      if (!body.email) return res.status(400).json({ error: "email requis" });

      // Upsert user_services — create if missing, update with valid subscription status
      const validSubStatuses = ['active', 'inactive', 'cancelled', 'expired', 'pending'];
      const subStatus = validSubStatuses.includes(body.status) ? body.status : 'active';
      await db.query(
        `INSERT INTO user_services (user_id, service_type, subscription_status, subscription_start)
         SELECT id, $2, $1, CURRENT_DATE FROM users WHERE LOWER(email) = LOWER($3) LIMIT 1
         ON CONFLICT (user_id, service_type) DO UPDATE SET subscription_status = $1`,
        [subStatus, service, body.email]
      );

      // Build upsert for the booking table
      const cols = ["email", "full_name", "address", "amount", "status", "notes", "start_date", ...extraFields.map(f => f.col)];
      const vals = [
        body.email,
        body.fullName || body.full_name || null,
        body.address || null,
        body.amount || null,
        body.status || "pending",
        body.notes || null,
        body.startDate || null,
        ...extraFields.map(f => body[f.key] !== undefined ? body[f.key] : f.default),
      ];
      const setClauses = cols.slice(1).map((c, i) => `${c} = $${i + 2}`).join(", ");
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");

      await db.query(
        `INSERT INTO ${tableName} (${cols.join(", ")}, updated_at)
         VALUES (${placeholders}, NOW())
         ON CONFLICT (email) DO UPDATE SET ${setClauses}, updated_at = NOW()`,
        vals
      );

      res.json({ message: "Réservation mise à jour" });
    } catch (err) {
      console.error(`Admin ${service} upsert error:`, err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // DELETE booking
  router.delete(`/${service}/bookings/:email`, async (req, res) => {
    try {
      const email = decodeURIComponent(req.params.email);
      await db.query(`DELETE FROM ${tableName} WHERE LOWER(email) = LOWER($1)`, [email]);
      await db.query(
        `DELETE FROM user_services WHERE user_id = (SELECT id FROM users WHERE LOWER(email) = LOWER($1)) AND service_type = $2`,
        [email, service]
      );
      res.json({ message: "Réservation supprimée" });
    } catch (err) {
      console.error(`Admin ${service} delete error:`, err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // GET config
  router.get(`/${service}/config`, async (_req, res) => {
    try {
      const result = await db.query(`SELECT pricing_config, global_promo FROM ${configTable} WHERE id = 1`);
      if (result.rows.length === 0) return res.json({ pricingConfig: null, globalPromo: null });
      res.json({ pricingConfig: result.rows[0].pricing_config, globalPromo: result.rows[0].global_promo });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // PUT config
  router.put(`/${service}/config`, async (req, res) => {
    try {
      const { pricingConfig } = req.body;
      if (!pricingConfig) return res.status(400).json({ error: "pricingConfig requis" });
      await db.query(
        `INSERT INTO ${configTable} (id, pricing_config, updated_at) VALUES (1, $1, NOW())
         ON CONFLICT (id) DO UPDATE SET pricing_config = $1, updated_at = NOW()`,
        [JSON.stringify(pricingConfig)]
      );
      res.json({ message: "Configuration mise à jour" });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // PUT global-promo
  router.put(`/${service}/global-promo`, async (req, res) => {
    try {
      const { globalPromo } = req.body;
      await db.query(
        `INSERT INTO ${configTable} (id, global_promo, updated_at) VALUES (1, $1, NOW())
         ON CONFLICT (id) DO UPDATE SET global_promo = $1, updated_at = NOW()`,
        [globalPromo ? JSON.stringify(globalPromo) : null]
      );
      res.json({ message: "Promotion globale mise à jour" });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // GET discounts
  router.get(`/${service}/discounts`, async (_req, res) => {
    try {
      const result = await db.query(`SELECT * FROM ${discountTable} ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // PUT discounts
  router.put(`/${service}/discounts`, async (req, res) => {
    try {
      const { email, discountType, percent, startsAt, endsAt } = req.body;
      if (!email || !discountType || percent == null || !startsAt || !endsAt) {
        return res.status(400).json({ error: "Tous les champs sont requis" });
      }
      await db.query(
        `INSERT INTO ${discountTable} (email, discount_type, percent, starts_at, ends_at, updated_at)
         VALUES (LOWER($1), $2, $3, $4, $5, NOW())
         ON CONFLICT (email) DO UPDATE SET discount_type = $2, percent = $3, starts_at = $4, ends_at = $5, updated_at = NOW()`,
        [email, discountType, percent, startsAt, endsAt]
      );
      res.json({ message: "Remise enregistrée" });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // DELETE discount
  router.delete(`/${service}/discounts/:email`, async (req, res) => {
    try {
      await db.query(`DELETE FROM ${discountTable} WHERE LOWER(email) = LOWER($1)`, [decodeURIComponent(req.params.email)]);
      res.json({ message: "Remise supprimée" });
    } catch (err) {
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
}

// Register routes for each Multi-Impala service
makeServiceRoutes("nettoyage", "nettoyage_client_bookings", "nettoyage_config", "nettoyage_discounts", [
  { col: "company", key: "company", default: null },
  { col: "surface", key: "surface", default: "small" },
  { col: "duration", key: "duration", default: 2 },
  { col: "date", key: "date", default: null },
  { col: "time", key: "time", default: null },
]);

makeServiceRoutes("repassage", "repassage_client_bookings", "repassage_config", "repassage_discounts", [
  { col: "quantity", key: "quantity", default: "small" },
  { col: "clothing_types", key: "clothingTypes", default: [] },
  { col: "duration", key: "duration", default: 1 },
  { col: "date", key: "date", default: null },
  { col: "time", key: "time", default: null },
]);

makeServiceRoutes("demenagement", "demenagement_client_bookings", "demenagement_config", "demenagement_discounts", [
  { col: "address_from", key: "addressFrom", default: null },
  { col: "address_to", key: "addressTo", default: null },
  { col: "volume", key: "volume", default: "studio" },
  { col: "extras", key: "extras", default: [] },
  { col: "duration", key: "duration", default: 4 },
  { col: "date", key: "date", default: null },
  { col: "time", key: "time", default: null },
]);

// ============================================================
// ADMIN REAL ESTATE ADS
// ============================================================

// GET /api/admin/real-estate/ads — all ads regardless of status
router.get("/real-estate/ads", async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT r.id, r.title, r.ad_type, r.city, r.price, r.rent_price, r.charges, r.surface,
              r.rooms, r.status, r.views, r.created_at, r.description, r.address,
              u.full_name as author_name
       FROM real_estate_ads r
       JOIN users u ON r.user_id = u.id
       ORDER BY r.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Admin real estate ads error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/admin/real-estate/ads/:id
router.delete("/real-estate/ads/:id", async (req, res) => {
  try {
    await db.query("DELETE FROM real_estate_ads WHERE id = $1", [req.params.id]);
    res.json({ message: "Annonce supprimée" });
  } catch (err) {
    console.error("Admin delete real estate ad error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================
// ADMIN REVENUE
// ============================================================

// GET /api/admin/revenue — aggregated revenue data + transactions
router.get("/revenue", async (_req, res) => {
  try {
    // Transactions from trash_client_subs
    const trashTx = await db.query(
      `SELECT
         'TCS-' || id::text AS id,
         COALESCE(full_name, email) AS "user",
         email,
         'trash' AS service,
         CONCAT('Abonnement Poubelles - ', INITCAP(plan), ' (', frequency, ')') AS desc,
         REGEXP_REPLACE(amount, '[^0-9.]', '', 'g')::numeric AS amount,
         TO_CHAR(created_at, 'DD/MM/YYYY') AS date,
         CASE status WHEN 'active' THEN 'paid' WHEN 'pending' THEN 'pending' ELSE 'refunded' END AS status,
         'Mobile Money' AS method,
         created_at
       FROM trash_client_subs
       ORDER BY created_at DESC`
    );

    // Transactions from invoices (Stripe)
    const invoiceTx = await db.query(
      `SELECT
         'INV-' || SUBSTR(i.id::text, 1, 8) AS id,
         u.full_name AS "user",
         u.email,
         COALESCE(
           (SELECT CASE us.service_type
             WHEN 'real_estate' THEN 'real_estate'
             WHEN 'auto' THEN 'auto'
             WHEN 'trash' THEN 'trash'
             ELSE 'real_estate' END
            FROM user_services us WHERE us.user_id = i.user_id LIMIT 1
           ),
           'real_estate'
         ) AS service,
         CONCAT('Facture Stripe #', SUBSTR(i.stripe_invoice_id, 1, 16)) AS desc,
         i.amount::numeric AS amount,
         TO_CHAR(i.created_at, 'DD/MM/YYYY') AS date,
         CASE i.status
           WHEN 'paid' THEN 'paid'
           WHEN 'open' THEN 'pending'
           WHEN 'void' THEN 'refunded'
           ELSE 'pending'
         END AS status,
         'Carte bancaire' AS method,
         i.created_at
       FROM invoices i
       JOIN users u ON i.user_id = u.id
       ORDER BY i.created_at DESC`
    );

    const allTx = [...trashTx.rows, ...invoiceTx.rows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(({ created_at, ...rest }) => rest);

    // Monthly chart (last 12 months) using clean CTEs
    const monthlyChart = await db.query(
      `WITH months AS (
         SELECT generate_series(
           date_trunc('month', NOW() - INTERVAL '11 months'),
           date_trunc('month', NOW()),
           '1 month'::interval
         ) AS month
       ),
       trash_monthly AS (
         SELECT
           date_trunc('month', created_at) AS month,
           SUM(REGEXP_REPLACE(amount, '[^0-9.]', '', 'g')::numeric) AS poubelles
         FROM trash_client_subs
         WHERE status = 'active' AND created_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1
       ),
       immo_monthly AS (
         SELECT
           date_trunc('month', i.created_at) AS month,
           SUM(i.amount) AS immobilier
         FROM invoices i
         JOIN user_services us ON us.user_id = i.user_id AND us.service_type = 'real_estate'
         WHERE i.status = 'paid' AND i.created_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1
       ),
       auto_monthly AS (
         SELECT
           date_trunc('month', i.created_at) AS month,
           SUM(i.amount) AS auto_rev
         FROM invoices i
         JOIN user_services us ON us.user_id = i.user_id AND us.service_type = 'auto'
         WHERE i.status = 'paid' AND i.created_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1
       )
       SELECT
         TO_CHAR(m.month, 'Mon') AS month,
         TO_CHAR(m.month, 'YYYY') AS year,
         TO_CHAR(m.month, '"Q"Q') AS quarter_label,
         EXTRACT(QUARTER FROM m.month)::int AS quarter_num,
         COALESCE(tm.poubelles, 0)::numeric AS poubelles,
         COALESCE(im.immobilier, 0)::numeric AS immobilier,
         COALESCE(am.auto_rev, 0)::numeric AS auto
       FROM months m
       LEFT JOIN trash_monthly tm ON tm.month = m.month
       LEFT JOIN immo_monthly im ON im.month = m.month
       LEFT JOIN auto_monthly am ON am.month = m.month
       ORDER BY m.month`
    );

    // Totals
    const trashTotal = trashTx.rows.filter(t => t.status === 'paid').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const immoTotal = invoiceTx.rows.filter(t => t.status === 'paid' && t.service === 'real_estate').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const autoTotal = invoiceTx.rows.filter(t => t.status === 'paid' && t.service === 'auto').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const pendingTotal = allTx.filter(t => t.status === 'pending').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const refundedTotal = allTx.filter(t => t.status === 'refunded').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

    res.json({
      transactions: allTx,
      totals: {
        total: trashTotal + immoTotal + autoTotal,
        poubelles: trashTotal,
        immobilier: immoTotal,
        auto: autoTotal,
        pending: pendingTotal,
        refunded: refundedTotal,
      },
      monthlyChart: monthlyChart.rows,
    });
  } catch (err) {
    console.error("Admin revenue error:", err);
    res.status(500).json({ error: "Erreur serveur", transactions: [], totals: { total: 0, poubelles: 0, immobilier: 0, auto: 0, pending: 0, refunded: 0 }, monthlyChart: [] });
  }
});

// PATCH /api/admin/revenue/transactions/:id/status
router.patch("/revenue/transactions/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["paid", "pending", "refunded"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }
    if (id.startsWith("TCS-")) {
      const numId = id.replace("TCS-", "");
      const dbStatus = status === "paid" ? "active" : status === "refunded" ? "inactive" : "pending";
      await db.query("UPDATE trash_client_subs SET status = $1 WHERE id = $2", [dbStatus, numId]);
    } else if (id.startsWith("INV-")) {
      const prefix = id.replace("INV-", "");
      const dbStatus = status === "paid" ? "paid" : status === "refunded" ? "void" : "open";
      await db.query("UPDATE invoices SET status = $1 WHERE id::text LIKE $2", [dbStatus, prefix + "%"]);
    }
    res.json({ message: "Statut mis à jour" });
  } catch (err) {
    console.error("Update tx status error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
// PATCH /api/admin/users/:id/services/statuses — update per-service subscription statuses
router.patch("/users/:id/services/statuses", async (req, res) => {
  try {
    const { id } = req.params;
    const { statuses } = req.body;
    if (!statuses || typeof statuses !== 'object') return res.status(400).json({ error: 'statuses requis' });
    for (const [service, svcStatus] of Object.entries(statuses)) {
      const normalized = svcStatus === 'approved' ? 'active' : svcStatus;
      if (normalized === 'active') {
        // Set subscription_start if not already set, and subscription_end to +30 days
        await db.query(
          `UPDATE user_services
           SET subscription_status = 'active',
               subscription_start = COALESCE(subscription_start, NOW()),
               subscription_end   = COALESCE(subscription_end, NOW() + INTERVAL '30 days')
           WHERE user_id = $1 AND service_type = $2`,
          [id, service]
        );
        const svcToReqType = { real_estate: 'immobilier', auto: 'automobile', nettoyage: 'nettoyage', trash: 'poubelles' };
        const reqType = svcToReqType[service];
        if (reqType) {
          await db.query(
            "UPDATE subscription_requests SET status = 'approved', reviewed_at = NOW() WHERE user_id = $1 AND service_type = $2 AND status = 'pending'",
            [id, reqType]
          );
        }
      } else {
        await db.query(
          "UPDATE user_services SET subscription_status = $1 WHERE user_id = $2 AND service_type = $3",
          [normalized, id, service]
        );
      }
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Admin update service statuses error:', err);
    res.status(500).json({ error: 'Erreur serveur' });
  }
});


// DELETE /api/admin/users/:id/services/:service — remove one service from a user
router.delete("/users/:id/services/:service", async (req, res) => {
  try {
    const { id, service } = req.params;
    await db.query(
      "DELETE FROM user_services WHERE user_id = $1 AND service_type = $2",
      [id, service]
    );
    res.json({ success: true });
  } catch (err) {
    console.error("Admin delete user service error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// ============================================================
// SUBSCRIPTION REQUESTS (demandes d'abonnement)
// ============================================================

// GET /api/admin/subscription-requests?status=pending|approved|rejected
router.get("/subscription-requests", async (req, res) => {
  try {
    const { status = "pending" } = req.query;
    const validStatuses = ["pending", "approved", "rejected", "all"];
    const where = status === "all" ? "" : `WHERE sr.status = '${validStatuses.includes(status) ? status : "pending"}'`;
    const result = await db.query(
      `SELECT sr.id, sr.service_type, sr.plan_type, sr.formula, sr.payment_method,
              sr.amount, sr.annual, sr.status, sr.admin_note,
              sr.created_at, sr.reviewed_at,
              u.id::text as user_id, u.full_name, u.email, u.phone
       FROM subscription_requests sr
       JOIN users u ON sr.user_id = u.id
       ${where}
       ORDER BY sr.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Subscription requests error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/subscription-requests/:id/approve
router.patch("/subscription-requests/:id/approve", async (req, res) => {
  try {
    const { id } = req.params;
    const reqResult = await db.query(
      "SELECT * FROM subscription_requests WHERE id = $1 AND status = 'pending'",
      [id]
    );
    if (reqResult.rows.length === 0) {
      return res.status(404).json({ error: "Demande non trouvee ou deja traitee" });
    }
    const sub = reqResult.rows[0];
    const intervalMs = sub.annual ? 365 * 24 * 60 * 60 * 1000 : 30 * 24 * 60 * 60 * 1000;
    const startDate = new Date();
    const endDate = new Date(Date.now() + intervalMs);

    const svcMap = {
      immobilier: ["real_estate"],
      automobile: ["auto"],
      "immo-auto": ["real_estate", "auto"],
    };
    const svc_types = svcMap[sub.service_type] || [];

    // Marquer la demande approuvee
    await db.query(
      "UPDATE subscription_requests SET status = 'approved', reviewed_at = NOW(), reviewed_by = $2 WHERE id = $1",
      [id, req.user.userId]
    );

    // Creer l enregistrement d abonnement actif
    await db.query(
      `INSERT INTO subscriptions (user_id, plan_type, status, current_period_start, current_period_end, billing_period, amount)
       VALUES ($1, $2, 'active', $3, $4, $5, $6)
       ON CONFLICT DO NOTHING`,
      [sub.user_id, sub.plan_type, startDate, endDate, sub.annual ? "annual" : "monthly", sub.amount]
    );

    // Activer user_services
    for (const svc_type of svc_types) {
      await db.query(
        `INSERT INTO user_services (user_id, service_type, subscription_status, subscription_start, subscription_end)
         VALUES ($1, $2, 'active', $3, $4)
         ON CONFLICT (user_id, service_type)
         DO UPDATE SET subscription_status = 'active', subscription_start = $3, subscription_end = $4`,
        [sub.user_id, svc_type, startDate, endDate]
      );
    }

    res.json({ success: true, message: "Abonnement active avec succes" });
  } catch (err) {
    console.error("Approve subscription error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/admin/subscription-requests/:id/reject
router.patch("/subscription-requests/:id/reject", async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const reqResult = await db.query(
      "SELECT * FROM subscription_requests WHERE id = $1 AND status = 'pending'",
      [id]
    );
    if (reqResult.rows.length === 0) {
      return res.status(404).json({ error: "Demande non trouvee ou deja traitee" });
    }
    const sub = reqResult.rows[0];
    const svcMap = {
      immobilier: ["real_estate"],
      automobile: ["auto"],
      "immo-auto": ["real_estate", "auto"],
    };
    const svc_types = svcMap[sub.service_type] || [];

    await db.query(
      "UPDATE subscription_requests SET status = 'rejected', admin_note = $2, reviewed_at = NOW(), reviewed_by = $3 WHERE id = $1",
      [id, reason || null, req.user.userId]
    );
    for (const svc_type of svc_types) {
      await db.query(
        "UPDATE user_services SET subscription_status = 'inactive' WHERE user_id = $1 AND service_type = $2",
        [sub.user_id, svc_type]
      );
    }
    res.json({ success: true, message: "Demande rejetee" });
  } catch (err) {
    console.error("Reject subscription error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/admin/service-subscribers?service=auto|real_estate|nettoyage|repassage|demenagement|trash
router.get("/service-subscribers", async (req, res) => {
  try {
    const { service } = req.query;
    const validServices = ['auto', 'real_estate', 'nettoyage', 'repassage', 'demenagement', 'trash'];
    if (!service || !validServices.includes(service)) {
      return res.status(400).json({ error: 'Service invalide' });
    }

    // Backfill NULL dates from subscription_requests for this service on-the-fly
    const reqTypeFilter = service === 'real_estate'
      ? `sr.service_type IN ('immobilier', 'immo-auto')`
      : service === 'auto'
        ? `sr.service_type IN ('automobile', 'immo-auto')`
        : `sr.service_type = '${service}'`;

    await db.query(
      `UPDATE user_services us
       SET subscription_start = COALESCE(us.subscription_start, sub.reviewed_at, sub.created_at),
           subscription_end   = COALESCE(us.subscription_end,
             sub.reviewed_at + (CASE WHEN sub.annual THEN INTERVAL '365 days' ELSE INTERVAL '30 days' END),
             sub.created_at  + (CASE WHEN sub.annual THEN INTERVAL '365 days' ELSE INTERVAL '30 days' END))
       FROM (
         SELECT DISTINCT ON (sr.user_id) sr.user_id, sr.reviewed_at, sr.created_at, sr.annual
         FROM subscription_requests sr
         WHERE sr.status = 'approved' AND ${reqTypeFilter}
         ORDER BY sr.user_id, COALESCE(sr.reviewed_at, sr.created_at) DESC
       ) sub
       WHERE us.user_id = sub.user_id
         AND us.service_type = $1
         AND (us.subscription_start IS NULL OR us.subscription_end IS NULL)`,
      [service]
    );

    const result = await db.query(
      `SELECT u.id, u.email, u.full_name, u.phone, u.adresse,
              us.subscription_status,
              us.subscription_start,
              us.subscription_end,
              u.created_at as user_created_at
       FROM user_services us
       JOIN users u ON us.user_id = u.id
       WHERE us.service_type = $1
       ORDER BY us.subscription_start DESC NULLS LAST, u.created_at DESC`,
      [service]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Service subscribers error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});
module.exports = router;

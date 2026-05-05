const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../db");
const path = require("path");
const { authenticateToken, requireSuperAdmin } = require("../middleware/auth");
const {
  readEntries,
  updateEntry,
  deleteEntry,
  clearEntries,
} = require("../services/actionAudit");

const router = express.Router();
const SALT_ROUNDS = 12;

// All routes require super_admin role
router.use(authenticateToken, requireSuperAdmin);

// ============================================================
// SUIVIS DES ACTIONS EXECUTER (HTML AUDIT FILE)
// ============================================================

// GET /api/superadmin/audit
router.get("/audit", async (_req, res) => {
  try {
    const entries = readEntries();
    res.json(entries);
  } catch (err) {
    console.error("Superadmin audit list error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/superadmin/audit/html
router.get("/audit/html", async (_req, res) => {
  try {
    const filePath = path.join(__dirname, "../../uploads/audit/suivis-des-actions-executer.html");
    res.sendFile(filePath);
  } catch (err) {
    console.error("Superadmin audit html error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/superadmin/audit/:id
router.patch("/audit/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { action, details, method, path: apiPath, statusCode } = req.body;

    const updated = updateEntry(id, {
      ...(action !== undefined ? { action } : {}),
      ...(details !== undefined ? { details } : {}),
      ...(method !== undefined ? { method } : {}),
      ...(apiPath !== undefined ? { path: apiPath } : {}),
      ...(statusCode !== undefined ? { statusCode } : {}),
    });

    if (!updated) {
      return res.status(404).json({ error: "Entrée introuvable" });
    }

    res.json(updated);
  } catch (err) {
    console.error("Superadmin audit update error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/superadmin/audit/:id
router.delete("/audit/:id", async (req, res) => {
  try {
    const removed = deleteEntry(req.params.id);
    if (!removed) {
      return res.status(404).json({ error: "Entrée introuvable" });
    }
    res.json({ message: "Entrée supprimée" });
  } catch (err) {
    console.error("Superadmin audit delete error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/superadmin/audit
router.delete("/audit", async (_req, res) => {
  try {
    clearEntries();
    res.json({ message: "Historique vidé" });
  } catch (err) {
    console.error("Superadmin audit clear error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================
// STATS GLOBALES
// ============================================================

// GET /api/superadmin/stats
router.get("/stats", async (_req, res) => {
  try {
    const [users, admins, supportAgents, financeAgents, reAds, autoAds, revenue] = await Promise.all([
      db.query("SELECT COUNT(*) FROM users WHERE role NOT IN ('super_admin', 'admin', 'support_agent', 'finance_agent')"),
      db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'"),
      db.query("SELECT COUNT(*) FROM users WHERE role = 'support_agent'"),
      db.query("SELECT COUNT(*) FROM users WHERE role = 'finance_agent'"),
      db.query("SELECT COUNT(*) FROM real_estate_ads"),
      db.query("SELECT COUNT(*) FROM auto_ads"),
      db.query("SELECT COALESCE(SUM(amount), 0) as total FROM invoices WHERE status = 'paid'"),
    ]);

    res.json({
      total_users: parseInt(users.rows[0].count),
      total_admins: parseInt(admins.rows[0].count),
      total_support_agents: parseInt(supportAgents.rows[0].count),
      total_finance_agents: parseInt(financeAgents.rows[0].count),
      total_real_estate_ads: parseInt(reAds.rows[0].count),
      total_auto_ads: parseInt(autoAds.rows[0].count),
      total_revenue: parseFloat(revenue.rows[0].total),
    });
  } catch (err) {
    console.error("Superadmin stats error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================
// GESTION DU PERSONNEL (admins, agents)
// ============================================================

// GET /api/superadmin/staff — list all staff (admins + agents)
router.get("/staff", async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, email, full_name, role, status, is_verified, created_at
       FROM users
       WHERE role IN ('admin', 'support_agent', 'finance_agent')
       ORDER BY role, created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Superadmin staff list error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/superadmin/staff — create admin, support_agent or finance_agent
router.post("/staff", async (req, res) => {
  try {
    const { email, password, full_name, role } = req.body;

    const allowedRoles = ["admin", "support_agent", "finance_agent"];
    if (!email || !password || !full_name || !allowedRoles.includes(role)) {
      return res.status(400).json({ error: "Email, mot de passe, nom et rôle valide requis" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Le mot de passe doit contenir au moins 8 caractères" });
    }

    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: "Cet email est déjà utilisé" });
    }

    const password_hash = await bcrypt.hash(password, SALT_ROUNDS);
    const result = await db.query(
      `INSERT INTO users (email, password_hash, full_name, role, status, is_verified)
       VALUES ($1, $2, $3, $4, 'approved', true)
       RETURNING id, email, full_name, role, status, is_verified, created_at`,
      [email, password_hash, full_name, role]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error("Superadmin create staff error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/superadmin/staff/:id — update role or reset password
router.patch("/staff/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { role, password, full_name } = req.body;

    const allowedRoles = ["admin", "support_agent", "finance_agent"];

    // Prevent editing super_admin accounts
    const target = await db.query("SELECT role FROM users WHERE id = $1", [id]);
    if (target.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
    if (target.rows[0].role === "super_admin") {
      return res.status(403).json({ error: "Impossible de modifier un super administrateur" });
    }

    const updates = [];
    const values = [];
    let idx = 1;

    if (full_name) { updates.push(`full_name = $${idx++}`); values.push(full_name); }
    if (role && allowedRoles.includes(role)) { updates.push(`role = $${idx++}`); values.push(role); }
    if (password) {
      if (password.length < 8) return res.status(400).json({ error: "Mot de passe trop court" });
      const hash = await bcrypt.hash(password, SALT_ROUNDS);
      updates.push(`password_hash = $${idx++}`);
      values.push(hash);
    }

    if (updates.length === 0) return res.status(400).json({ error: "Aucune modification fournie" });

    values.push(id);
    const result = await db.query(
      `UPDATE users SET ${updates.join(", ")}, updated_at = NOW() WHERE id = $${idx} RETURNING id, email, full_name, role, status, is_verified, created_at`,
      values
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Superadmin update staff error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/superadmin/staff/:id
router.delete("/staff/:id", async (req, res) => {
  try {
    const target = await db.query("SELECT role FROM users WHERE id = $1", [req.params.id]);
    if (target.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
    if (target.rows[0].role === "super_admin") {
      return res.status(403).json({ error: "Impossible de supprimer un super administrateur" });
    }

    await db.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ message: "Compte supprimé" });
  } catch (err) {
    console.error("Superadmin delete staff error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================
// TOUS LES UTILISATEURS (vue complète sans filtrage)
// ============================================================

// GET /api/superadmin/users
router.get("/users", async (req, res) => {
  try {
    const { page = 1, limit = 200, role } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const ALLOWED_ROLES = ["user", "pro", "visiteur", "admin", "trash_agent", "super_admin", "support_agent", "finance_agent"];
    let queryText;
    let queryParams;
    if (role && ALLOWED_ROLES.includes(role)) {
      queryText = `SELECT u.id, u.email, u.full_name, u.role, u.status, u.is_verified, u.phone, u.created_at
       FROM users u
       WHERE u.role = $1
       ORDER BY u.created_at DESC
       LIMIT $2 OFFSET $3`;
      queryParams = [role, parseInt(limit), offset];
    } else {
      queryText = `SELECT u.id, u.email, u.full_name, u.role, u.status, u.is_verified, u.phone, u.created_at
       FROM users u
       WHERE u.role <> 'super_admin'
       ORDER BY u.created_at DESC
       LIMIT $1 OFFSET $2`;
      queryParams = [parseInt(limit), offset];
    }

    const result = await db.query(queryText, queryParams);

    res.json(result.rows);
  } catch (err) {
    console.error("Superadmin users error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/superadmin/users/:id/status
router.patch("/users/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected", "suspended"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }

    const target = await db.query("SELECT role FROM users WHERE id = $1", [id]);
    if (target.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
    if (target.rows[0].role === "super_admin") {
      return res.status(403).json({ error: "Impossible de modifier le super administrateur" });
    }

    const result = await db.query(
      "UPDATE users SET status = $1, is_verified = $2, updated_at = NOW() WHERE id = $3 RETURNING id, status",
      [status, status === "approved", id]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Superadmin user status error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/superadmin/users/:id
router.delete("/users/:id", async (req, res) => {
  try {
    const target = await db.query("SELECT role FROM users WHERE id = $1", [req.params.id]);
    if (target.rows.length === 0) return res.status(404).json({ error: "Utilisateur introuvable" });
    if (target.rows[0].role === "super_admin") {
      return res.status(403).json({ error: "Impossible de supprimer le super administrateur" });
    }

    await db.query("DELETE FROM users WHERE id = $1", [req.params.id]);
    res.json({ message: "Utilisateur supprimé" });
  } catch (err) {
    console.error("Superadmin delete user error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================
// TOUTES LES ANNONCES
// ============================================================

// GET /api/superadmin/ads
router.get("/ads", async (_req, res) => {
  try {
    const [reAds, autoAds] = await Promise.all([
      db.query(
        `SELECT r.id, r.title, r.city, r.status, r.price, r.created_at, 'real_estate' as type, u.full_name as author, u.email as author_email
         FROM real_estate_ads r JOIN users u ON r.user_id = u.id
         ORDER BY r.created_at DESC`
      ),
      db.query(
        `SELECT a.id, CONCAT(a.brand, ' ', a.model) as title, a.location_text as city, a.status, a.rent_price_day as price, a.created_at, 'auto' as type, u.full_name as author, u.email as author_email
         FROM auto_ads a JOIN users u ON a.user_id = u.id
         ORDER BY a.created_at DESC`
      ),
    ]);

    const all = [...reAds.rows, ...autoAds.rows].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    res.json(all);
  } catch (err) {
    console.error("Superadmin ads error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/superadmin/ads/:type/:id/status
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
    console.error("Superadmin ad status error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/superadmin/ads/:type/:id
router.delete("/ads/:type/:id", async (req, res) => {
  try {
    const { type, id } = req.params;
    const table = type === "real_estate" ? "real_estate_ads" : "auto_ads";
    await db.query(`DELETE FROM ${table} WHERE id = $1`, [id]);
    res.json({ message: "Annonce supprimée" });
  } catch (err) {
    console.error("Superadmin delete ad error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ============================================================
// REVENUS
// ============================================================

// GET /api/superadmin/revenue
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

    // Amount extractor: strips CDF/$ and thousand separators, returns numeric string
    const extractAmount = (raw) => {
      if (!raw) return null;
      const n = parseFloat(String(raw).replace(/[^0-9.]/g, ""));
      return isNaN(n) ? null : n;
    };

    const amountExpr = `CASE WHEN amount IS NULL OR TRIM(amount::text) = '' THEN 0
        ELSE COALESCE(NULLIF(REGEXP_REPLACE(amount::text, '[^0-9.]', '', 'g'), '')::numeric, 0) END`;

    const nettoyageTx = await db.query(
      `SELECT
         'NET-' || id::text AS id,
         COALESCE(full_name, email) AS "user",
         email,
         'nettoyage' AS service,
         CONCAT('Nettoyage - ', INITCAP(COALESCE(surface, 'Standard'))) AS desc,
         ${amountExpr} AS amount,
         COALESCE(TO_CHAR(updated_at, 'DD/MM/YYYY'), TO_CHAR(NOW(), 'DD/MM/YYYY')) AS date,
         CASE status WHEN 'active' THEN 'paid' WHEN 'confirmed' THEN 'paid' WHEN 'pending' THEN 'pending' ELSE 'pending' END AS status,
         'Mobile Money' AS method,
         updated_at AS created_at
       FROM nettoyage_client_bookings
       WHERE amount IS NOT NULL AND TRIM(amount::text) != ''
       ORDER BY updated_at DESC`
    );

    const repassageTx = await db.query(
      `SELECT
         'REP-' || id::text AS id,
         COALESCE(full_name, email) AS "user",
         email,
         'repassage' AS service,
         CONCAT('Repassage - ', INITCAP(COALESCE(quantity::text, 'Standard'))) AS desc,
         ${amountExpr} AS amount,
         COALESCE(TO_CHAR(updated_at, 'DD/MM/YYYY'), TO_CHAR(NOW(), 'DD/MM/YYYY')) AS date,
         CASE status WHEN 'active' THEN 'paid' WHEN 'confirmed' THEN 'paid' WHEN 'pending' THEN 'pending' ELSE 'pending' END AS status,
         'Mobile Money' AS method,
         updated_at AS created_at
       FROM repassage_client_bookings
       WHERE amount IS NOT NULL AND TRIM(amount::text) != ''
       ORDER BY updated_at DESC`
    );

    const demenagementTx = await db.query(
      `SELECT
         'DEM-' || id::text AS id,
         COALESCE(full_name, email) AS "user",
         email,
         'demenagement' AS service,
         CONCAT('Déménagement - ', INITCAP(COALESCE(volume, 'Standard'))) AS desc,
         ${amountExpr} AS amount,
         COALESCE(TO_CHAR(updated_at, 'DD/MM/YYYY'), TO_CHAR(NOW(), 'DD/MM/YYYY')) AS date,
         CASE status WHEN 'active' THEN 'paid' WHEN 'confirmed' THEN 'paid' WHEN 'pending' THEN 'pending' ELSE 'pending' END AS status,
         'Mobile Money' AS method,
         updated_at AS created_at
       FROM demenagement_client_bookings
       WHERE amount IS NOT NULL AND TRIM(amount::text) != ''
       ORDER BY updated_at DESC`
    );

    // Transactions from approved manual subscription requests (immobilier / automobile)
    const subTx = await db.query(
      `SELECT
         'SUB-' || SUBSTR(sr.id::text, 1, 8) AS id,
         COALESCE(u.full_name, u.email) AS "user",
         u.email,
         CASE sr.service_type
           WHEN 'immobilier' THEN 'real_estate'
           WHEN 'automobile' THEN 'auto'
           ELSE 'real_estate'
         END AS service,
         CONCAT(
           'Abonnement ',
           CASE sr.service_type
             WHEN 'immobilier' THEN 'Immobilier'
             WHEN 'automobile' THEN 'Automobile'
             WHEN 'immo-auto' THEN 'Immo+Auto'
             ELSE INITCAP(sr.service_type)
           END,
           ' - Formule ', sr.formula::text,
           ' (', CASE WHEN sr.annual THEN 'Annuel' ELSE 'Mensuel' END, ')'
         ) AS desc,
         sr.amount::numeric AS amount,
         TO_CHAR(COALESCE(sr.reviewed_at, sr.created_at), 'DD/MM/YYYY') AS date,
         'paid' AS status,
         COALESCE(sr.payment_method, 'Mobile Money') AS method,
         COALESCE(sr.reviewed_at, sr.created_at) AS created_at
       FROM subscription_requests sr
       JOIN users u ON sr.user_id = u.id
       WHERE sr.status = 'approved'
       ORDER BY COALESCE(sr.reviewed_at, sr.created_at) DESC`
    );

    const allTx = [...trashTx.rows, ...invoiceTx.rows, ...subTx.rows, ...nettoyageTx.rows, ...repassageTx.rows, ...demenagementTx.rows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(({ created_at, ...rest }) => rest);

    const amtCte = `CASE WHEN amount IS NULL OR TRIM(amount::text) = '' THEN 0
        ELSE COALESCE(NULLIF(REGEXP_REPLACE(amount::text, '[^0-9.]', '', 'g'), '')::numeric, 0) END`;

    // Monthly chart (last 12 months)
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
         SELECT month, SUM(v) AS immobilier FROM (
           SELECT date_trunc('month', i.created_at) AS month, i.amount AS v
           FROM invoices i
           JOIN user_services us ON us.user_id = i.user_id AND us.service_type = 'real_estate'
           WHERE i.status = 'paid' AND i.created_at >= NOW() - INTERVAL '12 months'
           UNION ALL
           SELECT date_trunc('month', COALESCE(sr.reviewed_at, sr.created_at)), sr.amount
           FROM subscription_requests sr
           WHERE sr.status = 'approved' AND sr.service_type IN ('immobilier', 'immo-auto')
             AND COALESCE(sr.reviewed_at, sr.created_at) >= NOW() - INTERVAL '12 months'
         ) _i GROUP BY month
       ),
       auto_monthly AS (
         SELECT month, SUM(v) AS auto_rev FROM (
           SELECT date_trunc('month', i.created_at) AS month, i.amount AS v
           FROM invoices i
           JOIN user_services us ON us.user_id = i.user_id AND us.service_type = 'auto'
           WHERE i.status = 'paid' AND i.created_at >= NOW() - INTERVAL '12 months'
           UNION ALL
           SELECT date_trunc('month', COALESCE(sr.reviewed_at, sr.created_at)), sr.amount
           FROM subscription_requests sr
           WHERE sr.status = 'approved' AND sr.service_type = 'automobile'
             AND COALESCE(sr.reviewed_at, sr.created_at) >= NOW() - INTERVAL '12 months'
         ) _a GROUP BY month
       ),
       nettoyage_monthly AS (
         SELECT
           date_trunc('month', updated_at) AS month,
           SUM(${amtCte}) AS nettoyage
         FROM nettoyage_client_bookings
         WHERE status IN ('active', 'confirmed') AND updated_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1
       ),
       repassage_monthly AS (
         SELECT
           date_trunc('month', updated_at) AS month,
           SUM(${amtCte}) AS repassage
         FROM repassage_client_bookings
         WHERE status IN ('active', 'confirmed') AND updated_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1
       ),
       demenagement_monthly AS (
         SELECT
           date_trunc('month', updated_at) AS month,
           SUM(${amtCte}) AS demenagement
         FROM demenagement_client_bookings
         WHERE status IN ('active', 'confirmed') AND updated_at >= NOW() - INTERVAL '12 months'
         GROUP BY 1
       )
       SELECT
         TO_CHAR(m.month, 'Mon') AS month,
         TO_CHAR(m.month, 'YYYY') AS year,
         TO_CHAR(m.month, '"Q"Q') AS quarter_label,
         EXTRACT(QUARTER FROM m.month)::int AS quarter_num,
         COALESCE(tm.poubelles, 0)::numeric AS poubelles,
         COALESCE(im.immobilier, 0)::numeric AS immobilier,
         COALESCE(am.auto_rev, 0)::numeric AS auto,
         COALESCE(nm.nettoyage, 0)::numeric AS nettoyage,
         COALESCE(rm.repassage, 0)::numeric AS repassage,
         COALESCE(dm.demenagement, 0)::numeric AS demenagement
       FROM months m
       LEFT JOIN trash_monthly tm ON tm.month = m.month
       LEFT JOIN immo_monthly im ON im.month = m.month
       LEFT JOIN auto_monthly am ON am.month = m.month
       LEFT JOIN nettoyage_monthly nm ON nm.month = m.month
       LEFT JOIN repassage_monthly rm ON rm.month = m.month
       LEFT JOIN demenagement_monthly dm ON dm.month = m.month
       ORDER BY m.month`
    );

    const paid = (rows) => rows.filter(t => t.status === 'paid').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const trashTotal = paid(trashTx.rows);
    const immoTotal =
      invoiceTx.rows.filter(t => t.status === 'paid' && t.service === 'real_estate').reduce((s, t) => s + parseFloat(t.amount || 0), 0) +
      subTx.rows.filter(t => t.service === 'real_estate').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const autoTotal =
      invoiceTx.rows.filter(t => t.status === 'paid' && t.service === 'auto').reduce((s, t) => s + parseFloat(t.amount || 0), 0) +
      subTx.rows.filter(t => t.service === 'auto').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const nettoyageTotal = paid(nettoyageTx.rows);
    const repassageTotal = paid(repassageTx.rows);
    const demenagementTotal = paid(demenagementTx.rows);
    const multiservicesTotal = nettoyageTotal + repassageTotal + demenagementTotal;
    const pendingTotal = allTx.filter(t => t.status === 'pending').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const refundedTotal = allTx.filter(t => t.status === 'refunded').reduce((s, t) => s + parseFloat(t.amount || 0), 0);

    res.json({
      transactions: allTx,
      totals: {
        total: trashTotal + immoTotal + autoTotal + multiservicesTotal,
        poubelles: trashTotal,
        immobilier: immoTotal,
        auto: autoTotal,
        nettoyage: nettoyageTotal,
        repassage: repassageTotal,
        demenagement: demenagementTotal,
        multiservices: multiservicesTotal,
        pending: pendingTotal,
        refunded: refundedTotal,
      },
      monthlyChart: monthlyChart.rows,
    });
  } catch (err) {
    console.error("Superadmin revenue error:", err);
    res.status(500).json({ error: "Erreur serveur", transactions: [], totals: { total: 0, poubelles: 0, immobilier: 0, auto: 0, pending: 0, refunded: 0 }, monthlyChart: [] });
  }
});

// PATCH /api/superadmin/revenue/transactions/:id/status
router.patch("/revenue/transactions/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!["paid", "pending", "refunded"].includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }
    if (id.startsWith("TCS-")) {
      const numId = id.replace("TCS-", "");
      const dbStatus = status === "paid" ? "active" : status === "pending" ? "pending" : "cancelled";
      await db.query("UPDATE trash_client_subs SET status = $1 WHERE id = $2", [dbStatus, numId]);
    } else if (id.startsWith("INV-")) {
      const prefix = id.replace("INV-", "");
      const dbStatus = status === "paid" ? "paid" : status === "pending" ? "open" : "void";
      await db.query("UPDATE invoices SET status = $1 WHERE SUBSTR(id::text, 1, 8) = $2", [dbStatus, prefix]);
    } else if (id.startsWith("SUB-")) {
      const prefix = id.replace("SUB-", "");
      const dbStatus = status === "paid" ? "approved" : status === "pending" ? "pending" : "rejected";
      await db.query("UPDATE subscription_requests SET status = $1 WHERE SUBSTR(id::text, 1, 8) = $2", [dbStatus, prefix]);
    }
    res.json({ message: "Statut mis à jour" });
  } catch (err) {
    console.error("Superadmin revenue status error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

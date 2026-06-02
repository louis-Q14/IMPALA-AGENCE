const express = require("express");
const db = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Middleware: finance_agent only (super_admin bypasses automatically)
router.use(authenticateToken, requireRole("finance_agent"));

// GET /api/finance/revenue
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
         COALESCE(sr.unite, 'CDF') AS unite,
         TO_CHAR(COALESCE(sr.reviewed_at, sr.created_at), 'DD/MM/YYYY') AS date,
         'paid' AS status,
         COALESCE(sr.payment_method, 'Mobile Money') AS method,
         COALESCE(sr.reviewed_at, sr.created_at) AS created_at
       FROM subscription_requests sr
       JOIN users u ON sr.user_id = u.id
       WHERE sr.status = 'approved'
       ORDER BY COALESCE(sr.reviewed_at, sr.created_at) DESC`
    );

    const allTx = [...trashTx.rows, ...invoiceTx.rows, ...subTx.rows]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .map(({ created_at, ...rest }) => rest);

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

    const trashTotal = trashTx.rows.filter(t => t.status === 'paid').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const immoTotal =
      invoiceTx.rows.filter(t => t.status === 'paid' && t.service === 'real_estate').reduce((s, t) => s + parseFloat(t.amount || 0), 0) +
      subTx.rows.filter(t => t.service === 'real_estate').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
    const autoTotal =
      invoiceTx.rows.filter(t => t.status === 'paid' && t.service === 'auto').reduce((s, t) => s + parseFloat(t.amount || 0), 0) +
      subTx.rows.filter(t => t.service === 'auto').reduce((s, t) => s + parseFloat(t.amount || 0), 0);
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
    console.error("Finance revenue error:", err);
    res.status(500).json({ error: "Erreur serveur", transactions: [], totals: { total: 0, poubelles: 0, immobilier: 0, auto: 0, pending: 0, refunded: 0 }, monthlyChart: [] });
  }
});

// PATCH /api/finance/revenue/transactions/:id/status
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
    console.error("Finance revenue status error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

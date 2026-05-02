const express = require("express");
const db = require("../db");
const { authenticateToken } = require("../middleware/auth");

const router = express.Router();

function makeServiceRoutes(service, tableName, extraFields) {
  // GET /api/services/{service}/my-booking — user fetches their own booking
  router.get(`/${service}/my-booking`, authenticateToken, async (req, res) => {
    try {
      const result = await db.query(
        `SELECT * FROM ${tableName} WHERE LOWER(email) = LOWER($1)`,
        [req.user.email]
      );
      res.json({ booking: result.rows[0] || null });
    } catch (err) {
      console.error(`${service} my-booking error:`, err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });

  // POST /api/services/{service}/booking — user submits booking after payment
  router.post(`/${service}/booking`, authenticateToken, async (req, res) => {
    try {
      const email = req.user.email;
      const fullName = req.user.full_name || "";
      const body = req.body;

      const cols = [
        "email", "full_name", "address", "amount", "status",
        "notes", "date", "time", "duration",
        ...extraFields.map(f => f.col),
      ];
      const vals = [
        email, fullName,
        body.address || null,
        body.amount || null,
        body.status || "pending",
        body.notes || null,
        body.date || null,
        body.time || null,
        Number(body.duration) || null,
        ...extraFields.map(f => (body[f.key] !== undefined ? body[f.key] : f.default)),
      ];
      const setClauses = cols.slice(1).map((c, i) => `${c} = $${i + 2}`).join(", ");
      const placeholders = cols.map((_, i) => `$${i + 1}`).join(", ");

      const result = await db.query(
        `INSERT INTO ${tableName} (${cols.join(", ")}, updated_at)
         VALUES (${placeholders}, NOW())
         ON CONFLICT (email) DO UPDATE SET ${setClauses}, updated_at = NOW()
         RETURNING *`,
        vals
      );

      // Upsert user_services — create record if missing, otherwise mark active
      await db.query(
        `INSERT INTO user_services (user_id, service_type, subscription_status, subscription_start)
         SELECT id, $2, 'active', CURRENT_DATE FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1
         ON CONFLICT (user_id, service_type) DO UPDATE
           SET subscription_status = 'active',
               subscription_start = COALESCE(user_services.subscription_start, CURRENT_DATE)`,
        [email, service]
      );

      res.json({ booking: result.rows[0] });
    } catch (err) {
      console.error(`${service} booking submit error:`, err);
      res.status(500).json({ error: "Erreur serveur" });
    }
  });
}

makeServiceRoutes("nettoyage", "nettoyage_client_bookings", [
  { col: "company", key: "company", default: null },
  { col: "surface", key: "surface", default: "small" },
]);

makeServiceRoutes("repassage", "repassage_client_bookings", [
  { col: "quantity", key: "quantity", default: "small" },
  { col: "clothing_types", key: "clothingTypes", default: "[]" },
]);

makeServiceRoutes("demenagement", "demenagement_client_bookings", [
  { col: "address_from", key: "addressFrom", default: null },
  { col: "address_to", key: "addressTo", default: null },
  { col: "volume", key: "volume", default: "studio" },
  { col: "extras", key: "extras", default: "[]" },
]);

module.exports = router;

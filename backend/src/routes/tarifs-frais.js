const express = require("express");
const db = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// PUBLIC — no auth required (used by service booking pages to read active tarifs)
router.get("/public", async (req, res) => {
  try {
    const { service } = req.query;
    const where = ["actif = true"];
    const params = [];
    if (service) {
      const services = String(service).split(",").map(s => s.trim()).filter(Boolean);
      if (services.length === 1) {
        where.push(`service = $${params.length + 1}`);
        params.push(services[0]);
      } else {
        where.push(`service = ANY($${params.length + 1})`);
        params.push(services);
      }
    }
    const { rows } = await db.query(
      `SELECT id, nom, type, service, montant, unite, description
       FROM tarifs_frais WHERE ${where.join(" AND ")} ORDER BY type, nom`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUBLIC — GET service formula config (no auth)
router.get("/public-config/:service", async (req, res) => {
  try {
    const result = await db.query(
      "SELECT config FROM service_formula_config WHERE service = $1",
      [req.params.service]
    );
    res.json(result.rows.length > 0 ? { config: result.rows[0].config } : { config: null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// All routes below require auth
router.use(authenticateToken, requireRole("finance_agent"));

// Ensure service_formula_config table
async function ensureServiceFormulaConfig() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS service_formula_config (
      service VARCHAR(50) PRIMARY KEY,
      config JSONB,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
ensureServiceFormulaConfig().catch(console.error);

// PUT /api/tarifs-frais/config/:service — save formula config for a service (auth required)
router.put("/config/:service", async (req, res) => {
  try {
    const { config } = req.body;
    if (!config) return res.status(400).json({ error: "config requis" });
    await db.query(
      `INSERT INTO service_formula_config (service, config, updated_at)
       VALUES ($1, $2, NOW())
       ON CONFLICT (service) DO UPDATE SET config = EXCLUDED.config, updated_at = NOW()`,
      [req.params.service, JSON.stringify(config)]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});


// Ensure table exists and constraint is up to date
async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS tarifs_frais (
      id SERIAL PRIMARY KEY,
      nom VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL DEFAULT 'frais_fixe'
        CHECK (type IN ('frais_fixe', 'commission', 'abonnement', 'penalite', 'autre')),
      service VARCHAR(50) DEFAULT 'general'
        CHECK (service IN ('general', 'immobilier', 'automobile', 'poubelles', 'nettoyage', 'repassage', 'demenagement', 'finance')),
      montant NUMERIC(14,2) NOT NULL DEFAULT 0,
      unite VARCHAR(20) DEFAULT 'CDF'
        CHECK (unite IN ('CDF', 'USD', '%')),
      description TEXT,
      actif BOOLEAN DEFAULT true,
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  // Migrate existing constraint to include new services
  await db.query(`
    DO $$
    BEGIN
      ALTER TABLE tarifs_frais DROP CONSTRAINT IF EXISTS tarifs_frais_service_check;
      ALTER TABLE tarifs_frais
        ADD CONSTRAINT tarifs_frais_service_check
        CHECK (service IN ('general', 'immobilier', 'automobile', 'poubelles', 'nettoyage', 'repassage', 'demenagement', 'finance'));
    EXCEPTION WHEN others THEN
      NULL;
    END$$;
  `);
}
ensureTable().catch(console.error);

// GET /api/tarifs-frais
router.get("/", async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT t.*, u.full_name AS created_by_name
       FROM tarifs_frais t
       LEFT JOIN users u ON u.id = t.created_by
       ORDER BY t.service, t.type, t.nom`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/tarifs-frais
router.post("/", async (req, res) => {
  const { nom, type, service, montant, unite, description, actif } = req.body;
  if (!nom || montant === undefined) {
    return res.status(400).json({ error: "nom et montant sont requis" });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO tarifs_frais (nom, type, service, montant, unite, description, actif, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [nom, type || "frais_fixe", service || "general", montant,
       unite || "CDF", description || null, actif !== false, req.user.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/tarifs-frais/:id
router.put("/:id", async (req, res) => {
  const { nom, type, service, montant, unite, description, actif } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE tarifs_frais
       SET nom=$1, type=$2, service=$3, montant=$4, unite=$5, description=$6, actif=$7, updated_at=NOW()
       WHERE id=$8
       RETURNING *`,
      [nom, type || "frais_fixe", service || "general", montant,
       unite || "CDF", description || null, actif !== false, req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Tarif introuvable" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/tarifs-frais/:id
router.delete("/:id", async (req, res) => {
  try {
    const { rowCount } = await db.query("DELETE FROM tarifs_frais WHERE id=$1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "Tarif introuvable" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

const express = require("express");
const db = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();

// Accessible aux finance_agent et super_admin
router.use(authenticateToken, requireRole("finance_agent"));

// Ensure tables exist
async function ensureTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS depenses (
      id SERIAL PRIMARY KEY,
      libelle VARCHAR(255) NOT NULL,
      montant NUMERIC(14,2) NOT NULL DEFAULT 0,
      categorie VARCHAR(100),
      date DATE NOT NULL DEFAULT CURRENT_DATE,
      description TEXT,
      statut VARCHAR(20) DEFAULT 'en_attente' CHECK (statut IN ('paye', 'en_attente', 'annule')),
      created_by UUID REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
  await db.query(`
    CREATE TABLE IF NOT EXISTS prestations_salaires (
      id SERIAL PRIMARY KEY,
      depense_id INTEGER REFERENCES depenses(id) ON DELETE CASCADE,
      personnel_id UUID REFERENCES users(id) ON DELETE CASCADE,
      nb_prestations INTEGER NOT NULL DEFAULT 0,
      montant_unitaire NUMERIC(14,2),
      note TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    )
  `);
}
ensureTable().catch(console.error);

// GET /api/depenses/personnel — liste du personnel (admins + agents)
router.get("/personnel", async (_req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT id, full_name, email, role, status
       FROM users
       WHERE role IN ('admin', 'support_agent', 'finance_agent', 'trash_agent')
       ORDER BY role, full_name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/depenses/:id/prestations — get prestations for a depense
router.get("/:id/prestations", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT ps.*, u.full_name, u.email, u.role
       FROM prestations_salaires ps
       JOIN users u ON u.id = ps.personnel_id
       WHERE ps.depense_id = $1
       ORDER BY u.full_name ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/depenses/:id/prestations — save/replace all prestations for a depense
router.post("/:id/prestations", async (req, res) => {
  const { prestations } = req.body; // [{personnel_id, nb_prestations, montant_unitaire, note}]
  if (!Array.isArray(prestations)) {
    return res.status(400).json({ error: "prestations doit être un tableau" });
  }
  try {
    // Delete existing and re-insert
    await db.query("DELETE FROM prestations_salaires WHERE depense_id = $1", [req.params.id]);
    for (const p of prestations) {
      if (!p.personnel_id || !p.nb_prestations) continue;
      await db.query(
        `INSERT INTO prestations_salaires (depense_id, personnel_id, nb_prestations, montant_unitaire, note)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.params.id, p.personnel_id, p.nb_prestations, p.montant_unitaire || null, p.note || null]
      );
    }
    const { rows } = await db.query(
      `SELECT ps.*, u.full_name, u.email, u.role
       FROM prestations_salaires ps
       JOIN users u ON u.id = ps.personnel_id
       WHERE ps.depense_id = $1
       ORDER BY u.full_name ASC`,
      [req.params.id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/depenses — list all
router.get("/", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT d.*, u.full_name AS created_by_name
       FROM depenses d
       LEFT JOIN users u ON u.id = d.created_by
       ORDER BY d.date DESC, d.created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/depenses — create
router.post("/", async (req, res) => {
  const { libelle, montant, categorie, date, description, statut } = req.body;
  if (!libelle || montant === undefined || !date) {
    return res.status(400).json({ error: "libelle, montant et date sont requis" });
  }
  try {
    const { rows } = await db.query(
      `INSERT INTO depenses (libelle, montant, categorie, date, description, statut, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [libelle, montant, categorie || null, date, description || null, statut || "en_attente", req.user.userId]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/depenses/:id — update
router.put("/:id", async (req, res) => {
  const { libelle, montant, categorie, date, description, statut } = req.body;
  try {
    const { rows } = await db.query(
      `UPDATE depenses
       SET libelle=$1, montant=$2, categorie=$3, date=$4, description=$5, statut=$6, updated_at=NOW()
       WHERE id=$7
       RETURNING *`,
      [libelle, montant, categorie || null, date, description || null, statut || "en_attente", req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: "Dépense introuvable" });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/depenses/:id — delete
router.delete("/:id", async (req, res) => {
  try {
    const { rowCount } = await db.query("DELETE FROM depenses WHERE id=$1", [req.params.id]);
    if (rowCount === 0) return res.status(404).json({ error: "Dépense introuvable" });
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

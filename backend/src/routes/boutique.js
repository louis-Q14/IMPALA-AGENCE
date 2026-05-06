const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// ── GET /api/boutique/produits ──────────────────────────────────────────────
// Public — liste des produits avec filtres
router.get('/produits', async (req, res) => {
  try {
    const {
      categorie,
      sous_categorie,
      marque,
      dispo,
      q,
      sort = 'nom',
      page = 1,
      limit = 20,
    } = req.query;

    const params = [];
    let where = 'WHERE 1=1';

    if (categorie) {
      params.push(categorie);
      where += ` AND categorie = $${params.length}`;
    }
    if (sous_categorie) {
      params.push(sous_categorie);
      where += ` AND sous_categorie = $${params.length}`;
    }
    if (marque) {
      params.push(marque);
      where += ` AND marque = $${params.length}`;
    }
    if (dispo === 'true') {
      where += ` AND disponible = true AND stock > 0`;
    }
    if (q) {
      params.push(`%${q}%`);
      where += ` AND (nom ILIKE $${params.length} OR description ILIKE $${params.length} OR marque ILIKE $${params.length})`;
    }

    const orderMap = {
      nom: 'nom ASC',
      prix_asc: 'prix_cdf ASC',
      prix_desc: 'prix_cdf DESC',
      newest: 'created_at DESC',
    };
    const orderBy = orderMap[sort] || 'nom ASC';

    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const { rows } = await pool.query(
      `SELECT * FROM boutique_produits ${where} ORDER BY ${orderBy} LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );

    const countParams = params.slice(0, -2);
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM boutique_produits ${where}`,
      countParams
    );

    res.json({
      produits: rows,
      total: parseInt(countRows[0].count),
      page: Number(page),
      limit: Number(limit),
    });
  } catch (err) {
    console.error('GET boutique/produits error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/boutique/produits/:id ─────────────────────────────────────────
router.get('/produits/:id', async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM boutique_produits WHERE id = $1',
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('GET boutique/produits/:id error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/boutique/produits (admin only) ───────────────────────────────
router.post('/produits', authenticateToken, async (req, res) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  try {
    const {
      nom, description, prix_cdf, prix_usd, image, images,
      categorie, sous_categorie, marque, specifications, stock, disponible,
    } = req.body;

    if (!nom || !prix_cdf || !categorie) {
      return res.status(400).json({ message: 'nom, prix_cdf et categorie sont requis' });
    }

    const { rows } = await pool.query(
      `INSERT INTO boutique_produits
        (nom, description, prix_cdf, prix_usd, image, images, categorie, sous_categorie, marque, specifications, stock, disponible)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING *`,
      [nom, description, prix_cdf, prix_usd, image, images, categorie, sous_categorie, marque,
       specifications || {}, stock ?? 0, disponible ?? true]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('POST boutique/produits error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── PUT /api/boutique/produits/:id (admin only) ────────────────────────────
router.put('/produits/:id', authenticateToken, async (req, res) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  try {
    const {
      nom, description, prix_cdf, prix_usd, image, images,
      categorie, sous_categorie, marque, specifications, stock, disponible,
    } = req.body;

    const { rows } = await pool.query(
      `UPDATE boutique_produits SET
        nom=$1, description=$2, prix_cdf=$3, prix_usd=$4, image=$5, images=$6,
        categorie=$7, sous_categorie=$8, marque=$9, specifications=$10, stock=$11, disponible=$12
       WHERE id=$13 RETURNING *`,
      [nom, description, prix_cdf, prix_usd, image, images, categorie, sous_categorie, marque,
       specifications || {}, stock, disponible, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Produit introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT boutique/produits error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── DELETE /api/boutique/produits/:id (admin only) ─────────────────────────
router.delete('/produits/:id', authenticateToken, async (req, res) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  try {
    await pool.query('DELETE FROM boutique_produits WHERE id = $1', [req.params.id]);
    res.json({ message: 'Produit supprimé' });
  } catch (err) {
    console.error('DELETE boutique/produits error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── POST /api/boutique/commandes ───────────────────────────────────────────
router.post('/commandes', async (req, res) => {
  try {
    const {
      client, livraison, paiement, articles, total_cdf,
    } = req.body;

    if (!client?.nom || !client?.telephone || !articles?.length || !total_cdf) {
      return res.status(400).json({ message: 'Données de commande incomplètes' });
    }

    const ref = `IB-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

    const { rows } = await pool.query(
      `INSERT INTO boutique_commandes
        (ref, client_nom, client_telephone, client_ville, client_adresse,
         livraison_type, frais_livraison, paiement_methode, paiement_numero,
         code_transaction, total_cdf, articles)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
       RETURNING id, ref, statut, created_at`,
      [
        ref,
        client.nom, client.telephone, client.ville || '', client.adresse || '',
        livraison?.type || 'domicile', livraison?.frais || 0,
        paiement?.methode || '', paiement?.numero || '',
        paiement?.code_transaction || '',
        total_cdf, JSON.stringify(articles),
      ]
    );

    res.status(201).json({ ...rows[0], message: 'Commande enregistrée avec succès' });
  } catch (err) {
    console.error('POST boutique/commandes error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── GET /api/boutique/commandes (admin only) ───────────────────────────────
router.get('/commandes', authenticateToken, async (req, res) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  try {
    const { statut, page = 1, limit = 30 } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (statut) {
      params.push(statut);
      where += ` AND statut = $${params.length}`;
    }

    const offset = (Number(page) - 1) * Number(limit);
    params.push(Number(limit), offset);

    const { rows } = await pool.query(
      `SELECT * FROM boutique_commandes ${where} ORDER BY created_at DESC LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    res.json(rows);
  } catch (err) {
    console.error('GET boutique/commandes error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

// ── PUT /api/boutique/commandes/:id/statut (admin only) ───────────────────
router.put('/commandes/:id/statut', authenticateToken, async (req, res) => {
  if (!['admin', 'superadmin'].includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé' });
  }
  try {
    const { statut } = req.body;
    const valid = ['en_attente','paiement_confirme','en_preparation','expedie','livre','annule'];
    if (!valid.includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }
    const { rows } = await pool.query(
      'UPDATE boutique_commandes SET statut=$1 WHERE id=$2 RETURNING *',
      [statut, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Commande introuvable' });
    res.json(rows[0]);
  } catch (err) {
    console.error('PUT boutique/commandes statut error:', err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

module.exports = router;

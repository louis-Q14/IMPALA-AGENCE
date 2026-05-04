const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const db = require("../db");
const { authenticateToken, requireSubscription } = require("../middleware/auth");

const router = express.Router();

const UPLOADS_DIR = path.join(__dirname, "../../uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tmpDir = path.join(UPLOADS_DIR, "tmp");
    if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });
    cb(null, tmpDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const imageUpload = multer({
  storage,
  limits: { files: 15, fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (file.mimetype.startsWith("image/") || ext.endsWith(".heic") || ext.endsWith(".heif")) {
      cb(null, true); return;
    }
    cb(new Error("Seules les images sont autorisees"), false);
  },
});

// Migrate auto_ads to include all extended vehicle fields
async function ensureAutoSchema() {
  const cols = [
    "plate_number VARCHAR(50)",
    "country VARCHAR(100) DEFAULT 'Congo (RDC)'",
    "serie VARCHAR(100)",
    "color VARCHAR(100)",
    "doors INTEGER",
    "circulation_date DATE",
    "power VARCHAR(50)",
    "torque VARCHAR(50)",
    "aspiration VARCHAR(100)",
    "displacement VARCHAR(50)",
    "cylinders INTEGER",
    "engine_transmission VARCHAR(100)",
    "gears INTEGER",
    "top_speed_mph INTEGER",
    "top_speed_kmh INTEGER",
    "accel_0_60 VARCHAR(50)",
    "accel_0_100 VARCHAR(50)",
    "engine_position VARCHAR(50)",
    "fuel_urban VARCHAR(50)",
    "fuel_extra VARCHAR(50)",
    "fuel_mixed VARCHAR(50)",
    "co2_emissions VARCHAR(50)",
    "carbon_label VARCHAR(5)",
    "ct_expiry_date DATE",
    "ct_success_rate INTEGER",
    "ct_passed INTEGER",
    "ct_failed INTEGER",
    "ct_to_fix INTEGER",
    "ct_not_fixed INTEGER",
    "ct_dangerous INTEGER",
    "tax_due_date DATE",
    "tax_days_remaining INTEGER",
    "ct_validity_date DATE",
    "ct_days_remaining INTEGER",
    "owner_name VARCHAR(255)",
    "owner_phone VARCHAR(50)",
    "owner_email VARCHAR(255)",
    "owner_address TEXT",
    "owner_type VARCHAR(50) DEFAULT 'Particulier'",
    "insurance_status VARCHAR(50) DEFAULT 'Inconnu'",
    "insurance_expiry_date DATE",
    "ct_status VARCHAR(50) DEFAULT 'Inconnu'",
    "vehicle_status VARCHAR(50) DEFAULT 'Normal'",
    "notes TEXT",
    "views INTEGER DEFAULT 0",
    "updated_at TIMESTAMPTZ DEFAULT NOW()",
  ];
  for (const col of cols) {
    const name = col.split(" ")[0];
    await db.query(`ALTER TABLE auto_ads ADD COLUMN IF NOT EXISTS ${col}`).catch(() => {});
  }
}
ensureAutoSchema().catch(console.error);

// GET /api/auto/ads — public listing (active only)
router.get("/ads", async (req, res) => {
  try {
    const { brand, fuel, transmission, max_price, max_mileage, type, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = ["a.status = 'active'"];
    let params = [];
    let i = 1;
    if (brand) { where.push(`(a.brand ILIKE $${i} OR a.model ILIKE $${i})`); params.push(`%${brand}%`); i++; }
    if (fuel) { where.push(`a.fuel = $${i}`); params.push(fuel); i++; }
    if (transmission) { where.push(`a.transmission = $${i}`); params.push(transmission); i++; }
    if (max_price) { where.push(`COALESCE(a.price, a.rent_price_day) <= $${i}`); params.push(parseFloat(max_price)); i++; }
    if (max_mileage) { where.push(`a.mileage <= $${i}`); params.push(parseInt(max_mileage)); i++; }
    if (type) { where.push(`a.ad_type = $${i}`); params.push(type); i++; }
    const result = await db.query(
      `SELECT a.*, u.full_name as author_name,
              COALESCE(json_agg(p.photo_url ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL), '[]') as photos
       FROM auto_ads a JOIN users u ON a.user_id = u.id
       LEFT JOIN ad_photos p ON p.ad_id = a.id AND p.ad_type = 'auto'
       WHERE ${where.join(" AND ")} GROUP BY a.id, u.full_name
       ORDER BY a.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...params, parseInt(limit), offset]
    );
    const countResult = await db.query(
      `SELECT COUNT(*) FROM auto_ads a WHERE ${where.join(" AND ")}`, params
    );
    res.json({ data: result.rows, total: parseInt(countResult.rows[0].count) });
  } catch (err) { console.error("Auto list error:", err); res.status(500).json({ error: "Erreur serveur" }); }
});

// GET /api/auto/ads/all — admin: all statuses
router.get("/ads/all", authenticateToken, async (req, res) => {
  try {
    const { search, status, page = 1, limit = 100 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);
    let where = [];
    let params = [];
    let i = 1;
    if (status && status !== "all") { where.push(`a.status = $${i++}`); params.push(status); }
    if (search) {
      where.push(`(a.brand ILIKE $${i} OR a.model ILIKE $${i} OR a.plate_number ILIKE $${i} OR u.full_name ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }
    const whereClause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const result = await db.query(
      `SELECT a.*, u.full_name as author_name, u.email as author_email,
              COALESCE(json_agg(p.photo_url ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL), '[]') as photos
       FROM auto_ads a JOIN users u ON a.user_id = u.id
       LEFT JOIN ad_photos p ON p.ad_id = a.id AND p.ad_type = 'auto'
       ${whereClause} GROUP BY a.id, u.full_name, u.email
       ORDER BY a.created_at DESC LIMIT $${i} OFFSET $${i+1}`,
      [...params, parseInt(limit), offset]
    );
    res.json({ data: result.rows });
  } catch (err) { console.error("Auto admin list error:", err); res.status(500).json({ error: "Erreur serveur" }); }
});

// GET /api/auto/ads/:id — single ad
router.get("/ads/:id", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT a.*, u.full_name as author_name, u.email as author_email, u.phone as author_phone,
              COALESCE(json_agg(p.photo_url ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL), '[]') as photos
       FROM auto_ads a JOIN users u ON a.user_id = u.id
       LEFT JOIN ad_photos p ON p.ad_id = a.id AND p.ad_type = 'auto'
       WHERE a.id = $1 GROUP BY a.id, u.full_name, u.email, u.phone`,
      [req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Annonce introuvable" });
    await db.query(`UPDATE auto_ads SET views = COALESCE(views,0)+1 WHERE id=$1`, [req.params.id]).catch(() => {});
    res.json(result.rows[0]);
  } catch (err) { console.error("Auto get error:", err); res.status(500).json({ error: "Erreur serveur" }); }
});

function buildValues(body, userId) {
  const {
    brand, model, year, mileage, fuel, transmission, price, rent_price_day, description, location_text, ad_type,
    plate_number, country, serie, color, doors, circulation_date,
    power, torque, aspiration, displacement, cylinders, engine_transmission, gears,
    top_speed_mph, top_speed_kmh, accel_0_60, accel_0_100, engine_position,
    fuel_urban, fuel_extra, fuel_mixed, co2_emissions, carbon_label,
    ct_expiry_date, ct_success_rate, ct_passed, ct_failed, ct_to_fix, ct_not_fixed, ct_dangerous,
    tax_due_date, tax_days_remaining, ct_validity_date, ct_days_remaining,
    owner_name, owner_phone, owner_email, owner_address, owner_type,
    insurance_status, insurance_expiry_date, ct_status, vehicle_status, notes,
  } = body;
  const n = (v) => (v === "" || v === undefined) ? null : v;
  const vals = [
    userId, brand, model, n(year), n(mileage), fuel, transmission, n(price), n(rent_price_day),
    description, location_text, ad_type,
    plate_number, country || "Congo (RDC)", serie, color, n(doors), n(circulation_date),
    power, torque, aspiration, displacement, n(cylinders), engine_transmission, n(gears),
    n(top_speed_mph), n(top_speed_kmh), accel_0_60, accel_0_100, engine_position,
    fuel_urban, fuel_extra, fuel_mixed, co2_emissions, carbon_label,
    n(ct_expiry_date), n(ct_success_rate), n(ct_passed), n(ct_failed), n(ct_to_fix), n(ct_not_fixed), n(ct_dangerous),
    n(tax_due_date), n(tax_days_remaining), n(ct_validity_date), n(ct_days_remaining),
    owner_name, owner_phone, owner_email, owner_address, owner_type || "Particulier",
    insurance_status || "Inconnu", n(insurance_expiry_date), ct_status || "Inconnu",
    vehicle_status || "Normal", notes,
  ];
  return vals;
}

const COLS = `user_id,brand,model,year,mileage,fuel,transmission,price,rent_price_day,
description,location_text,ad_type,plate_number,country,serie,color,doors,circulation_date,
power,torque,aspiration,displacement,cylinders,engine_transmission,gears,
top_speed_mph,top_speed_kmh,accel_0_60,accel_0_100,engine_position,
fuel_urban,fuel_extra,fuel_mixed,co2_emissions,carbon_label,
ct_expiry_date,ct_success_rate,ct_passed,ct_failed,ct_to_fix,ct_not_fixed,ct_dangerous,
tax_due_date,tax_days_remaining,ct_validity_date,ct_days_remaining,
owner_name,owner_phone,owner_email,owner_address,owner_type,
insurance_status,insurance_expiry_date,ct_status,vehicle_status,notes`.replace(/\n/g,"");

// POST /api/auto/ads — create
router.post("/ads", authenticateToken, requireSubscription("auto"), imageUpload.array("photos", 15), async (req, res) => {
  try {
    const { brand, model, year, ad_type, photos } = req.body;
    if (!brand || !model || !year || !ad_type) return res.status(400).json({ error: "Marque, modèle, année et type requis" });
    const vals = buildValues(req.body, req.user.userId);
    const placeholders = vals.map((_, i) => `$${i+1}`).join(",");
    const result = await db.query(
      `INSERT INTO auto_ads (${COLS}) VALUES (${placeholders}) RETURNING *`, vals
    );
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const adFolderPath = path.join(UPLOADS_DIR, "users", String(req.user.userId), "auto", String(result.rows[0].id));
      fs.mkdirSync(adFolderPath, { recursive: true });
      for (let j = 0; j < req.files.length && j < 15; j++) {
        const file = req.files[j];
        const targetPath = path.join(adFolderPath, file.filename);
        fs.renameSync(file.path, targetPath);
        const fileUrl = `/uploads/users/${req.user.userId}/auto/${result.rows[0].id}/${file.filename}`;
        await db.query(`INSERT INTO ad_photos (ad_id,ad_type,photo_url,sort_order) VALUES ($1,'auto',$2,$3)`,
          [result.rows[0].id, fileUrl, j]);
      }
    }
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) { if (fs.existsSync(file.path)) fs.unlinkSync(file.path); }
    }
    console.error("Auto create error:", err);
    res.status(500).json({ error: "Erreur lors de la création" });
  }
});

// PUT /api/auto/ads/:id — update
router.put("/ads/:id", authenticateToken, requireSubscription("auto"), async (req, res) => {
  try {
    const vals = buildValues(req.body, req.user.userId);
    const colList = COLS.split(",").slice(1); // skip user_id
    const setClauses = colList.map((c, i) => `${c.trim()}=$${i+1}`).join(",");
    vals[0] = vals[0]; // user_id not needed for update — shift
    const updateVals = vals.slice(1); // remove user_id
    updateVals.push(req.params.id);
    const result = await db.query(
      `UPDATE auto_ads SET ${setClauses},updated_at=NOW() WHERE id=$${updateVals.length} RETURNING *`,
      updateVals
    );
    if (!result.rows.length) return res.status(404).json({ error: "Annonce introuvable" });
    res.json(result.rows[0]);
  } catch (err) { console.error("Auto update error:", err); res.status(500).json({ error: "Erreur mise à jour" }); }
});

// PATCH /api/auto/ads/:id/status — status change
router.patch("/ads/:id/status", authenticateToken, async (req, res) => {
  try {
    const { status } = req.body;
    if (!["active","pending","rejected"].includes(status)) return res.status(400).json({ error: "Statut invalide" });
    const result = await db.query(
      `UPDATE auto_ads SET status=$1,updated_at=NOW() WHERE id=$2 RETURNING *`, [status, req.params.id]
    );
    if (!result.rows.length) return res.status(404).json({ error: "Annonce introuvable" });
    res.json(result.rows[0]);
  } catch (err) { console.error("Auto status error:", err); res.status(500).json({ error: "Erreur serveur" }); }
});

// DELETE /api/auto/ads/:id
router.delete("/ads/:id", authenticateToken, requireSubscription("auto"), async (req, res) => {
  try {
    await db.query(`DELETE FROM ad_photos WHERE ad_id=$1 AND ad_type='auto'`, [req.params.id]);
    const result = await db.query(`DELETE FROM auto_ads WHERE id=$1 RETURNING id`, [req.params.id]);
    if (!result.rowCount) return res.status(404).json({ error: "Annonce introuvable" });
    res.json({ success: true });
  } catch (err) { console.error("Auto delete error:", err); res.status(500).json({ error: "Erreur suppression" }); }
});

// POST /api/auto/rentals
router.post("/rentals", authenticateToken, async (req, res) => {
  try {
    const { auto_ad_id, start_date, end_date } = req.body;
    const conflicts = await db.query(
      `SELECT id FROM auto_rentals WHERE auto_ad_id=$1 AND status IN ('pending','confirmed') AND start_date<=$3 AND end_date>=$2`,
      [auto_ad_id, start_date, end_date]
    );
    if (conflicts.rows.length) return res.status(409).json({ error: "Dates non disponibles" });
    const ad = await db.query("SELECT rent_price_day FROM auto_ads WHERE id=$1", [auto_ad_id]);
    if (!ad.rows.length) return res.status(404).json({ error: "Annonce non trouvée" });
    const days = Math.ceil((new Date(end_date) - new Date(start_date)) / 86400000);
    const total_price = days * ad.rows[0].rent_price_day;
    const result = await db.query(
      `INSERT INTO auto_rentals (auto_ad_id,renter_id,start_date,end_date,total_price) VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [auto_ad_id, req.user.userId, start_date, end_date, total_price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) { console.error("Rental error:", err); res.status(500).json({ error: "Erreur réservation" }); }
});

module.exports = router;
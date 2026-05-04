const express = require("express");
const fs = require("fs");
const multer = require("multer");
const path = require("path");
const db = require("../db");
const { authenticateToken, requireSubscription } = require("../middleware/auth");

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, "../../uploads");

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tmpDir = path.join(UPLOADS_DIR, "tmp");
    if (!fs.existsSync(tmpDir)) {
      fs.mkdirSync(tmpDir, { recursive: true });
    }
    cb(null, tmpDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const imageUpload = multer({
  storage,
  limits: {
    files: 25,
    fileSize: 15 * 1024 * 1024,
  },
  fileFilter: (_req, file, cb) => {
    const ext = file.originalname.toLowerCase();
    if (file.mimetype.startsWith("image/") || ext.endsWith(".heic") || ext.endsWith(".heif")) {
      cb(null, true);
      return;
    }
    cb(new Error("Seules les images sont autorisées pour cette annonce."), false);
  },
});

// GET /api/real-estate/ads
router.get("/ads", async (req, res) => {
  try {
    const { city, min_price, max_price, min_surface, rooms, type, page = 1, limit = 20 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let where = ["r.status = 'active'"];
    let params = [];
    let i = 1;

    if (city) { where.push(`r.city ILIKE $${i}`); params.push(`%${city}%`); i++; }
    if (min_price) { where.push(`COALESCE(r.price, r.rent_price) >= $${i}`); params.push(parseFloat(min_price)); i++; }
    if (max_price) { where.push(`COALESCE(r.price, r.rent_price) <= $${i}`); params.push(parseFloat(max_price)); i++; }
    if (min_surface) { where.push(`r.surface >= $${i}`); params.push(parseInt(min_surface)); i++; }
    if (rooms) { where.push(`r.rooms = $${i}`); params.push(parseInt(rooms)); i++; }
    if (type) { where.push(`r.ad_type = $${i}`); params.push(type); i++; }

    const query = `
      SELECT r.*, u.full_name as author_name,
             COALESCE(json_agg(p.photo_url ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL), '[]') as photos
      FROM real_estate_ads r
      JOIN users u ON r.user_id = u.id
      LEFT JOIN ad_photos p ON p.ad_id = r.id AND p.ad_type = 'real_estate'
      WHERE ${where.join(" AND ")}
      GROUP BY r.id, u.full_name
      ORDER BY r.created_at DESC
      LIMIT $${i} OFFSET $${i + 1}
    `;
    params.push(parseInt(limit), offset);

    const result = await db.query(query, params);

    const countResult = await db.query(
      `SELECT COUNT(*) FROM real_estate_ads r WHERE ${where.join(" AND ")}`,
      params.slice(0, -2)
    );

    res.json({
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: parseInt(countResult.rows[0].count),
        pages: Math.ceil(parseInt(countResult.rows[0].count) / parseInt(limit)),
      },
    });
  } catch (err) {
    console.error("Real estate list error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/real-estate/ads
router.post("/ads", authenticateToken, requireSubscription("real_estate"), imageUpload.array("images", 25), async (req, res) => {
  try {
    const { title, description, price, rent_price, charges, surface, rooms, bedrooms, address, city, postal_code, ad_type } = req.body;

    if (!title || !address || !ad_type) {
      return res.status(400).json({ error: "Titre, adresse et type requis" });
    }

    // Limite d'annonces : 1 par mois pour les particuliers (role = 'user')
    if (req.user.role === "user") {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const countResult = await db.query(
        `SELECT COUNT(*) FROM real_estate_ads WHERE user_id = $1 AND created_at >= $2`,
        [req.user.userId, startOfMonth.toISOString()]
      );
      if (parseInt(countResult.rows[0].count, 10) >= 1) {
        return res.status(403).json({ error: "Les comptes particuliers sont limités à 1 annonce immobilière par mois. Passez à un compte Professionnel pour publier sans limite." });
      }
    }

    const result = await db.query(
      `INSERT INTO real_estate_ads (user_id, title, description, price, rent_price, charges, surface, rooms, bedrooms, address, city, postal_code, ad_type, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 'active')
       RETURNING *`,
      [
        req.user.userId,
        title,
        description,
        price ? parseFloat(price) : null,
        rent_price ? parseFloat(rent_price) : null,
        charges ? parseFloat(charges) : null,
        surface ? parseInt(surface, 10) : null,
        rooms ? parseInt(rooms, 10) : null,
        bedrooms ? parseInt(bedrooms, 10) : null,
        address,
        city || null,
        postal_code || null,
        ad_type,
      ]
    );

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const adFolderPath = path.join(UPLOADS_DIR, "users", req.user.userId, "real_estate", result.rows[0].id);
      fs.mkdirSync(adFolderPath, { recursive: true });

      for (let j = 0; j < req.files.length && j < 25; j++) {
        const file = req.files[j];
        const targetPath = path.join(adFolderPath, file.filename);
        fs.renameSync(file.path, targetPath);

        const fileUrl = `/uploads/users/${req.user.userId}/real_estate/${result.rows[0].id}/${file.filename}`;
        await db.query(
          `INSERT INTO ad_photos (ad_id, ad_type, photo_url, sort_order) VALUES ($1, 'real_estate', $2, $3)`,
          [result.rows[0].id, fileUrl, j]
        );
      }
    }

    const folderResult = await db.query(
      `SELECT folder_path FROM real_estate_ad_folders WHERE ad_id = $1`,
      [result.rows[0].id]
    );

    res.status(201).json({
      ...result.rows[0],
      publication_folder: folderResult.rows[0]?.folder_path || null,
    });
  } catch (err) {
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      }
    }
    console.error("Real estate create error:", err);
    res.status(500).json({ error: "Erreur lors de la création" });
  }
});

// GET /api/real-estate/ads/:id
router.get("/ads/:id", async (req, res) => {
  try {
    const result = await db.query(
      `SELECT r.*, u.full_name as author_name, u.role as author_role,
              CASE WHEN u.role IN ('pro', 'admin', 'super_admin') THEN u.email ELSE NULL END as author_email,
              u.phone as author_phone,
              u.adresse as author_adresse,
              COALESCE(json_agg(p.photo_url ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL), '[]') as photos
       FROM real_estate_ads r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN ad_photos p ON p.ad_id = r.id AND p.ad_type = 'real_estate'
       WHERE r.id = $1
       GROUP BY r.id, u.full_name, u.role, u.email, u.phone, u.adresse`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Annonce non trouvée" });
    }

    // Increment views
    await db.query("UPDATE real_estate_ads SET views = views + 1 WHERE id = $1", [req.params.id]);

    res.json(result.rows[0]);
  } catch (err) {
    console.error("Real estate detail error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/real-estate/ads/:id  — owner or admin/super_admin
router.put("/ads/:id", authenticateToken, requireSubscription("real_estate"), imageUpload.array("newImages", 25), async (req, res) => {
  const adId = req.params.id;
  try {
    const adRes = await db.query("SELECT * FROM real_estate_ads WHERE id = $1", [adId]);
    if (adRes.rows.length === 0) {
      return res.status(404).json({ error: "Annonce non trouvée" });
    }
    const ad = adRes.rows[0];

    const isOwner = ad.user_id === req.user.userId;
    const isAdmin = ["admin", "super_admin"].includes(req.user.role);
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Accès non autorisé" });
    }

    const {
      title,
      description,
      price,
      rent_price,
      charges,
      surface,
      rooms,
      bedrooms,
      address,
      city,
      postal_code,
      ad_type,
      removedPhotos,
    } = req.body;

    const updates = [];
    const values = [];
    let i = 1;
    const setField = (col, val) => {
      updates.push(`${col} = $${i}`);
      values.push(val);
      i++;
    };

    if (title !== undefined) setField("title", title);
    if (description !== undefined) setField("description", description);
    if (price !== undefined) setField("price", price === "" || price === null ? null : parseFloat(price));
    if (rent_price !== undefined) setField("rent_price", rent_price === "" || rent_price === null ? null : parseFloat(rent_price));
    if (charges !== undefined) setField("charges", charges === "" || charges === null ? null : parseFloat(charges));
    if (surface !== undefined) setField("surface", surface === "" || surface === null ? null : parseInt(surface, 10));
    if (rooms !== undefined) setField("rooms", rooms === "" || rooms === null ? null : parseInt(rooms, 10));
    if (bedrooms !== undefined) setField("bedrooms", bedrooms === "" || bedrooms === null ? null : parseInt(bedrooms, 10));
    if (address !== undefined) setField("address", address);
    if (city !== undefined) setField("city", city || null);
    if (postal_code !== undefined) setField("postal_code", postal_code || null);
    if (ad_type !== undefined) setField("ad_type", ad_type);
    updates.push(`updated_at = NOW()`);

    if (updates.length > 1) {
      values.push(adId);
      await db.query(
        `UPDATE real_estate_ads SET ${updates.join(", ")} WHERE id = $${i}`,
        values
      );
    }

    let removedList = [];
    if (removedPhotos) {
      try {
        removedList = typeof removedPhotos === "string" ? JSON.parse(removedPhotos) : removedPhotos;
      } catch {
        removedList = [];
      }
    }
    if (Array.isArray(removedList) && removedList.length > 0) {
      for (const url of removedList) {
        await db.query(
          `DELETE FROM ad_photos WHERE ad_id = $1 AND ad_type = 'real_estate' AND photo_url = $2`,
          [adId, url]
        );
        const filePath = path.join(UPLOADS_DIR, url.replace(/^\/uploads\//, ""));
        if (fs.existsSync(filePath)) {
          try { fs.unlinkSync(filePath); } catch { /* ignore */ }
        }
      }
    }

    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const adFolderPath = path.join(UPLOADS_DIR, "users", ad.user_id, "real_estate", adId);
      fs.mkdirSync(adFolderPath, { recursive: true });

      const sortRes = await db.query(
        `SELECT COALESCE(MAX(sort_order), -1) AS max FROM ad_photos WHERE ad_id = $1 AND ad_type = 'real_estate'`,
        [adId]
      );
      let nextSort = parseInt(sortRes.rows[0].max, 10) + 1;

      for (const file of req.files) {
        const targetPath = path.join(adFolderPath, file.filename);
        fs.renameSync(file.path, targetPath);
        const fileUrl = `/uploads/users/${ad.user_id}/real_estate/${adId}/${file.filename}`;
        await db.query(
          `INSERT INTO ad_photos (ad_id, ad_type, photo_url, sort_order) VALUES ($1, 'real_estate', $2, $3)`,
          [adId, fileUrl, nextSort]
        );
        nextSort++;
      }
    }

    const result = await db.query(
      `SELECT r.*, u.full_name as author_name, u.role as author_role,
              COALESCE(json_agg(p.photo_url ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL), '[]') as photos
       FROM real_estate_ads r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN ad_photos p ON p.ad_id = r.id AND p.ad_type = 'real_estate'
       WHERE r.id = $1
       GROUP BY r.id, u.full_name, u.role`,
      [adId]
    );

    res.json(result.rows[0]);
  } catch (err) {
    if (req.files && Array.isArray(req.files)) {
      for (const file of req.files) {
        if (fs.existsSync(file.path)) {
          try { fs.unlinkSync(file.path); } catch { /* ignore */ }
        }
      }
    }
    console.error("Real estate update error:", err);
    res.status(500).json({ error: "Erreur lors de la mise à jour" });
  }
});

// GET /api/real-estate/ads/by-user/:userId
router.get("/ads/by-user/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const result = await db.query(
      `SELECT r.*, u.full_name as author_name, u.phone as author_phone,
              CASE WHEN u.role IN ('pro', 'admin', 'super_admin') THEN u.email ELSE NULL END as author_email,
              COALESCE(json_agg(p.photo_url ORDER BY p.sort_order) FILTER (WHERE p.id IS NOT NULL), '[]') as photos
       FROM real_estate_ads r
       JOIN users u ON r.user_id = u.id
       LEFT JOIN ad_photos p ON p.ad_id = r.id AND p.ad_type = 'real_estate'
       WHERE r.user_id = $1 AND r.status = 'active'
       GROUP BY r.id, u.full_name, u.phone, u.email, u.role
       ORDER BY r.created_at DESC`,
      [userId]
    );
    res.json({ data: result.rows });
  } catch (err) {
    console.error("Ads by user error:", err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

const express = require("express");
const multer  = require("multer");
const path    = require("path");
const fs      = require("fs");
const db      = require("../db");
const { authenticateToken, requireRole } = require("../middleware/auth");

const router = express.Router();
const UPLOADS_DIR = path.join(__dirname, "../../uploads/reservation");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const tmp = path.join(UPLOADS_DIR, "tmp");
    if (!fs.existsSync(tmp)) fs.mkdirSync(tmp, { recursive: true });
    cb(null, tmp);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});
const imageUpload = multer({
  storage,
  limits: { files: 20, fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) =>
    file.mimetype.startsWith("image/") ? cb(null, true) : cb(new Error("Images uniquement"), false),
});

// ─── Helper ───────────────────────────────────────────────────────────────────
async function getPropertyWithDetails(id) {
  const r = await db.query(
    `SELECT p.*,
            u.full_name  AS owner_name,
            u.phone      AS owner_phone,
            u.avatar_url AS owner_avatar,
            COALESCE(json_agg(DISTINCT jsonb_build_object('id', i.id, 'url', i.image_url, 'is_cover', i.is_cover, 'sort_order', i.sort_order))
              FILTER (WHERE i.id IS NOT NULL), '[]') AS images,
            COALESCE(json_agg(DISTINCT a.amenity) FILTER (WHERE a.id IS NOT NULL), '[]') AS amenities
     FROM reservation_properties p
     JOIN users u ON p.user_id = u.id
     LEFT JOIN reservation_property_images i ON i.property_id = p.id
     LEFT JOIN reservation_property_amenities a ON a.property_id = p.id
     WHERE p.id = $1
     GROUP BY p.id, u.full_name, u.phone, u.avatar_url`,
    [id]
  );
  return r.rows[0] || null;
}

// ─── PUBLIC ROUTES ────────────────────────────────────────────────────────────

// GET /api/reservation/properties — search + filter
router.get("/properties", async (req, res) => {
  try {
    const {
      city, property_type, listing_type,
      min_price, max_price,
      guests, bedrooms,
      check_in, check_out,
      page = 1, limit = 20,
    } = req.query;

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let where = ["p.status = 'active'"];
    let params = [];
    let i = 1;

    if (city)          { where.push(`p.city ILIKE $${i}`);           params.push(`%${city}%`); i++; }
    if (property_type) { where.push(`p.property_type = $${i}`);      params.push(property_type); i++; }
    if (listing_type)  { where.push(`p.listing_type = $${i}`);       params.push(listing_type); i++; }
    if (guests)        { where.push(`p.max_guests >= $${i}`);        params.push(parseInt(guests)); i++; }
    if (bedrooms)      { where.push(`p.bedrooms >= $${i}`);          params.push(parseInt(bedrooms)); i++; }
    if (min_price) {
      where.push(`COALESCE(p.price_per_night, p.price_per_month) >= $${i}`);
      params.push(parseFloat(min_price)); i++;
    }
    if (max_price) {
      where.push(`COALESCE(p.price_per_night, p.price_per_month) <= $${i}`);
      params.push(parseFloat(max_price)); i++;
    }
    // Exclude booked dates
    if (check_in && check_out) {
      where.push(`p.id NOT IN (
        SELECT DISTINCT property_id FROM reservation_bookings
        WHERE status IN ('confirmed','pending')
          AND check_in < $${i+1} AND check_out > $${i}
      )`);
      params.push(check_in, check_out); i += 2;
    }

    const whereStr = where.join(" AND ");

    const [rows, countRow] = await Promise.all([
      db.query(
        `SELECT p.*, u.full_name AS owner_name,
                COALESCE(json_agg(DISTINCT jsonb_build_object('id', img.id, 'url', img.image_url, 'is_cover', img.is_cover))
                  FILTER (WHERE img.id IS NOT NULL), '[]') AS images
         FROM reservation_properties p
         JOIN users u ON p.user_id = u.id
         LEFT JOIN reservation_property_images img ON img.property_id = p.id
         WHERE ${whereStr}
         GROUP BY p.id, u.full_name
         ORDER BY p.is_featured DESC, p.rating_avg DESC, p.created_at DESC
         LIMIT $${i} OFFSET $${i+1}`,
        [...params, limitNum, offset]
      ),
      db.query(`SELECT COUNT(*) FROM reservation_properties p WHERE ${whereStr}`, params),
    ]);

    res.json({
      properties: rows.rows,
      total: parseInt(countRow.rows[0].count),
      page: pageNum,
      pages: Math.ceil(parseInt(countRow.rows[0].count) / limitNum),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/reservation/featured — featured properties for landing
router.get("/featured", async (_req, res) => {
  try {
    const rows = await db.query(
      `SELECT p.*, u.full_name AS owner_name,
              COALESCE(json_agg(DISTINCT jsonb_build_object('url', img.image_url, 'is_cover', img.is_cover))
                FILTER (WHERE img.id IS NOT NULL), '[]') AS images
       FROM reservation_properties p
       JOIN users u ON p.user_id = u.id
       LEFT JOIN reservation_property_images img ON img.property_id = p.id
       WHERE p.status = 'active'
       GROUP BY p.id, u.full_name
       ORDER BY p.is_featured DESC, p.rating_avg DESC, p.view_count DESC
       LIMIT 12`
    );
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/reservation/properties/:id — detail
router.get("/properties/:id", async (req, res) => {
  try {
    const prop = await getPropertyWithDetails(req.params.id);
    if (!prop) return res.status(404).json({ error: "Bien non trouvé" });

    // Increment view count
    db.query("UPDATE reservation_properties SET view_count = view_count + 1 WHERE id = $1", [req.params.id]);

    // Blocked dates for calendar
    const blocked = await db.query(
      "SELECT blocked_date FROM reservation_availability WHERE property_id = $1 ORDER BY blocked_date",
      [req.params.id]
    );

    res.json({ ...prop, blocked_dates: blocked.rows.map(r => r.blocked_date) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/reservation/properties/:id/reviews
router.get("/properties/:id/reviews", async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT r.*, u.full_name AS reviewer_name, u.avatar_url AS reviewer_avatar
       FROM reservation_reviews r
       JOIN users u ON r.reviewer_id = u.id
       WHERE r.property_id = $1
       ORDER BY r.created_at DESC`,
      [req.params.id]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── AUTH REQUIRED ─────────────────────────────────────────────────────────────

// POST /api/reservation/properties — create
router.post("/properties", authenticateToken, async (req, res) => {
  try {
    const {
      title, description, property_type, listing_type,
      price_per_night, price_per_week, price_per_month, currency,
      city, address, country, latitude, longitude,
      bedrooms, bathrooms, max_guests, surface,
      cancellation_policy, check_in_time, check_out_time,
      min_stay, max_stay, instant_booking, amenities,
    } = req.body;

    if (!title || !property_type || !listing_type || !city) {
      return res.status(400).json({ error: "Titre, type, mode de location et ville requis" });
    }

    const result = await db.query(
      `INSERT INTO reservation_properties
         (user_id, title, description, property_type, listing_type,
          price_per_night, price_per_week, price_per_month, currency,
          city, address, country, latitude, longitude,
          bedrooms, bathrooms, max_guests, surface,
          cancellation_policy, check_in_time, check_out_time,
          min_stay, max_stay, instant_booking, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,'pending')
       RETURNING id`,
      [
        req.user.userId, title, description, property_type, listing_type,
        price_per_night || null, price_per_week || null, price_per_month || null, currency || "USD",
        city, address, country || "République Démocratique du Congo", latitude || null, longitude || null,
        bedrooms || 1, bathrooms || 1, max_guests || 2, surface || null,
        cancellation_policy || "flexible", check_in_time || "14:00", check_out_time || "11:00",
        min_stay || 1, max_stay || null, instant_booking || false,
      ]
    );

    const propId = result.rows[0].id;

    // Insert amenities
    if (amenities && Array.isArray(amenities)) {
      for (const a of amenities) {
        await db.query(
          "INSERT INTO reservation_property_amenities (property_id, amenity) VALUES ($1, $2)",
          [propId, a]
        );
      }
    }

    res.status(201).json({ id: propId, message: "Bien créé. En attente de validation." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/reservation/properties/:id — update (owner only)
router.put("/properties/:id", authenticateToken, async (req, res) => {
  try {
    const check = await db.query("SELECT user_id FROM reservation_properties WHERE id = $1", [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ error: "Bien non trouvé" });
    if (check.rows[0].user_id !== req.user.userId) return res.status(403).json({ error: "Accès refusé" });

    const {
      title, description, property_type, listing_type,
      price_per_night, price_per_week, price_per_month, currency,
      city, address, country, latitude, longitude,
      bedrooms, bathrooms, max_guests, surface,
      cancellation_policy, check_in_time, check_out_time,
      min_stay, max_stay, instant_booking, amenities,
    } = req.body;

    await db.query(
      `UPDATE reservation_properties SET
         title=$1, description=$2, property_type=$3, listing_type=$4,
         price_per_night=$5, price_per_week=$6, price_per_month=$7, currency=$8,
         city=$9, address=$10, country=$11, latitude=$12, longitude=$13,
         bedrooms=$14, bathrooms=$15, max_guests=$16, surface=$17,
         cancellation_policy=$18, check_in_time=$19, check_out_time=$20,
         min_stay=$21, max_stay=$22, instant_booking=$23,
         updated_at=NOW()
       WHERE id=$24`,
      [
        title, description, property_type, listing_type,
        price_per_night || null, price_per_week || null, price_per_month || null, currency || "USD",
        city, address, country, latitude || null, longitude || null,
        bedrooms || 1, bathrooms || 1, max_guests || 2, surface || null,
        cancellation_policy || "flexible", check_in_time || "14:00", check_out_time || "11:00",
        min_stay || 1, max_stay || null, instant_booking || false,
        req.params.id,
      ]
    );

    // Update amenities
    if (amenities && Array.isArray(amenities)) {
      await db.query("DELETE FROM reservation_property_amenities WHERE property_id = $1", [req.params.id]);
      for (const a of amenities) {
        await db.query(
          "INSERT INTO reservation_property_amenities (property_id, amenity) VALUES ($1, $2)",
          [req.params.id, a]
        );
      }
    }

    res.json({ message: "Bien mis à jour" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// DELETE /api/reservation/properties/:id
router.delete("/properties/:id", authenticateToken, async (req, res) => {
  try {
    const check = await db.query("SELECT user_id FROM reservation_properties WHERE id = $1", [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ error: "Bien non trouvé" });
    if (check.rows[0].user_id !== req.user.userId && req.user.role !== "admin" && req.user.role !== "super_admin") {
      return res.status(403).json({ error: "Accès refusé" });
    }
    await db.query("DELETE FROM reservation_properties WHERE id = $1", [req.params.id]);
    res.json({ message: "Bien supprimé" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/reservation/properties/:id/images
router.post("/properties/:id/images", authenticateToken, imageUpload.array("images", 20), async (req, res) => {
  try {
    const check = await db.query("SELECT user_id FROM reservation_properties WHERE id = $1", [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ error: "Bien non trouvé" });
    if (check.rows[0].user_id !== req.user.userId) return res.status(403).json({ error: "Accès refusé" });

    const files = req.files || [];
    const propDir = path.join(UPLOADS_DIR, req.params.id);
    if (!fs.existsSync(propDir)) fs.mkdirSync(propDir, { recursive: true });

    // Count existing images
    const countRow = await db.query("SELECT COUNT(*) FROM reservation_property_images WHERE property_id = $1", [req.params.id]);
    let sortOrder = parseInt(countRow.rows[0].count);

    const inserted = [];
    for (const file of files) {
      const dest = path.join(propDir, file.filename);
      fs.renameSync(file.path, dest);
      const imageUrl = `/uploads/reservation/${req.params.id}/${file.filename}`;
      const isCover = sortOrder === 0;
      const row = await db.query(
        "INSERT INTO reservation_property_images (property_id, image_url, is_cover, sort_order) VALUES ($1,$2,$3,$4) RETURNING *",
        [req.params.id, imageUrl, isCover, sortOrder]
      );
      inserted.push(row.rows[0]);
      sortOrder++;
    }

    res.json({ uploaded: inserted.length, images: inserted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur upload" });
  }
});

// DELETE /api/reservation/images/:imageId
router.delete("/images/:imageId", authenticateToken, async (req, res) => {
  try {
    const row = await db.query(
      `SELECT i.*, p.user_id FROM reservation_property_images i
       JOIN reservation_properties p ON p.id = i.property_id
       WHERE i.id = $1`,
      [req.params.imageId]
    );
    if (!row.rows[0]) return res.status(404).json({ error: "Image non trouvée" });
    if (row.rows[0].user_id !== req.user.userId) return res.status(403).json({ error: "Accès refusé" });

    // Delete file
    const filePath = path.join(__dirname, "../../", row.rows[0].image_url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await db.query("DELETE FROM reservation_property_images WHERE id = $1", [req.params.imageId]);
    res.json({ message: "Image supprimée" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/reservation/my-properties — owner dashboard
router.get("/my-properties", authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT p.*,
              COALESCE(json_agg(DISTINCT jsonb_build_object('url', i.image_url, 'is_cover', i.is_cover))
                FILTER (WHERE i.id IS NOT NULL), '[]') AS images,
              (SELECT COUNT(*) FROM reservation_bookings b WHERE b.property_id = p.id AND b.status IN ('confirmed','pending')) AS active_bookings
       FROM reservation_properties p
       LEFT JOIN reservation_property_images i ON i.property_id = p.id
       WHERE p.user_id = $1
       GROUP BY p.id
       ORDER BY p.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── BOOKINGS ─────────────────────────────────────────────────────────────────

// POST /api/reservation/bookings — create booking (guest)
router.post("/bookings", authenticateToken, async (req, res) => {
  try {
    const { property_id, check_in, check_out, guests_count, payment_method, guest_message } = req.body;

    if (!property_id || !check_in || !check_out) {
      return res.status(400).json({ error: "Bien, date d'arrivée et départ requis" });
    }

    // Get property
    const prop = await db.query("SELECT * FROM reservation_properties WHERE id = $1 AND status = 'active'", [property_id]);
    if (!prop.rows[0]) return res.status(404).json({ error: "Bien non disponible" });
    const p = prop.rows[0];

    // Can't book own property
    if (p.user_id === req.user.userId) {
      return res.status(400).json({ error: "Vous ne pouvez pas réserver votre propre bien" });
    }

    // Check availability
    const conflict = await db.query(
      `SELECT id FROM reservation_bookings
       WHERE property_id = $1 AND status IN ('confirmed','pending')
         AND check_in < $3 AND check_out > $2`,
      [property_id, check_in, check_out]
    );
    if (conflict.rows.length > 0) {
      return res.status(409).json({ error: "Ces dates ne sont pas disponibles" });
    }

    // Calculate price
    const checkInDate  = new Date(check_in);
    const checkOutDate = new Date(check_out);
    const nights = Math.max(1, Math.ceil((checkOutDate - checkInDate) / (1000 * 60 * 60 * 24)));
    let totalPrice = 0;
    if (p.listing_type === "nuit" && p.price_per_night) totalPrice = nights * parseFloat(p.price_per_night);
    else if (p.listing_type === "semaine" && p.price_per_week) totalPrice = Math.ceil(nights / 7) * parseFloat(p.price_per_week);
    else if (p.listing_type === "mois" && p.price_per_month) totalPrice = Math.ceil(nights / 30) * parseFloat(p.price_per_month);

    const result = await db.query(
      `INSERT INTO reservation_bookings
         (property_id, guest_id, check_in, check_out, guests_count, nights_count, total_price, currency, payment_method, guest_message, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
       RETURNING id`,
      [
        property_id, req.user.userId, check_in, check_out,
        guests_count || 1, nights, totalPrice, p.currency || "USD",
        payment_method || "other", guest_message || null,
        p.instant_booking ? "confirmed" : "pending",
      ]
    );

    const bookingId = result.rows[0].id;

    // Block dates
    const dates = [];
    const d = new Date(check_in);
    while (d < checkOutDate) {
      dates.push(d.toISOString().split("T")[0]);
      d.setDate(d.getDate() + 1);
    }
    for (const date of dates) {
      await db.query(
        `INSERT INTO reservation_availability (property_id, blocked_date, reason, booking_id)
         VALUES ($1,$2,'booking',$3) ON CONFLICT (property_id, blocked_date) DO NOTHING`,
        [property_id, date, bookingId]
      );
    }

    res.status(201).json({
      id: bookingId,
      status: p.instant_booking ? "confirmed" : "pending",
      total_price: totalPrice,
      nights,
      message: p.instant_booking ? "Réservation confirmée !" : "Demande envoyée au propriétaire",
    });

    // ─── Auto-sync guest_message to messaging channel ────────────────────────
    if (guest_message && guest_message.trim()) {
      try {
        // Find or create conversation between guest and owner
        const existingConv = await db.query(
          `SELECT id FROM conversations
           WHERE ((participant_1 = $1 AND participant_2 = $2) OR (participant_1 = $2 AND participant_2 = $1))
             AND ad_id = $3 AND ad_type = 'reservation' LIMIT 1`,
          [req.user.userId, p.user_id, property_id]
        );
        let convId;
        if (existingConv.rows.length > 0) {
          convId = existingConv.rows[0].id;
        } else {
          const newConv = await db.query(
            `INSERT INTO conversations (ad_id, ad_type, participant_1, participant_2) VALUES ($1, $2, $3, $4) RETURNING id`,
            [property_id, "reservation", req.user.userId, p.user_id]
          );
          convId = newConv.rows[0].id;
        }
        const dateRange = `${check_in} → ${check_out}`;
        await db.query(
          `INSERT INTO messages (conversation_id, sender_id, content) VALUES ($1, $2, $3)`,
          [convId, req.user.userId, `[Demande de réservation ${dateRange}]\n${guest_message.trim()}`]
        );
      } catch (msgErr) {
        console.error("Message sync error (non-blocking):", msgErr.message);
      }
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/reservation/bookings/guest — guest's bookings
router.get("/bookings/guest", authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT b.*, p.title, p.city, p.property_type, p.listing_type,
              (SELECT image_url FROM reservation_property_images WHERE property_id = p.id AND is_cover = TRUE LIMIT 1) AS cover_image,
              u.full_name AS owner_name
       FROM reservation_bookings b
       JOIN reservation_properties p ON b.property_id = p.id
       JOIN users u ON p.user_id = u.id
       WHERE b.guest_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/reservation/bookings/owner — owner's incoming bookings
router.get("/bookings/owner", authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT b.*, p.title, p.city,
              (SELECT image_url FROM reservation_property_images WHERE property_id = p.id AND is_cover = TRUE LIMIT 1) AS cover_image,
              u.full_name AS guest_name, u.phone AS guest_phone, u.email AS guest_email
       FROM reservation_bookings b
       JOIN reservation_properties p ON b.property_id = p.id
       JOIN users u ON b.guest_id = u.id
       WHERE p.user_id = $1
       ORDER BY b.created_at DESC`,
      [req.user.userId]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PUT /api/reservation/bookings/:id — update status (owner or guest)
router.put("/bookings/:id", authenticateToken, async (req, res) => {
  try {
    const { status, owner_message } = req.body;

    const row = await db.query(
      `SELECT b.*, p.user_id AS owner_id FROM reservation_bookings b
       JOIN reservation_properties p ON p.id = b.property_id
       WHERE b.id = $1`,
      [req.params.id]
    );
    if (!row.rows[0]) return res.status(404).json({ error: "Réservation non trouvée" });
    const booking = row.rows[0];

    const isOwner = booking.owner_id === req.user.userId;
    const isGuest = booking.guest_id === req.user.userId;
    if (!isOwner && !isGuest) return res.status(403).json({ error: "Accès refusé" });

    // Owner can confirm/reject; guest can cancel
    const allowed = isOwner
      ? ["confirmed", "rejected", "completed"]
      : ["cancelled"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Statut non autorisé" });

    await db.query(
      "UPDATE reservation_bookings SET status=$1, owner_message=$2, updated_at=NOW() WHERE id=$3",
      [status, owner_message || booking.owner_message, req.params.id]
    );

    // Free dates if cancelled/rejected
    if (["cancelled", "rejected"].includes(status)) {
      await db.query("DELETE FROM reservation_availability WHERE booking_id = $1", [req.params.id]);
    }

    // Auto-pause property when booking is confirmed
    if (status === "confirmed") {
      await db.query(
        "UPDATE reservation_properties SET status='inactive', updated_at=NOW() WHERE id=$1",
        [booking.property_id]
      );
    }

    res.json({ message: "Statut mis à jour" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/reservation/bookings/approved — confirmed bookings for the owner's agenda
router.get("/bookings/approved", authenticateToken, async (req, res) => {
  try {
    const rows = await db.query(
      `SELECT b.id, b.status, b.check_in, b.check_out, b.nights_count, b.guests_count,
              b.total_price, b.currency, b.payment_method, b.guest_message, b.created_at, b.updated_at,
              p.id AS property_id, p.title, p.city, p.property_type, p.status AS property_status,
              (SELECT image_url FROM reservation_property_images WHERE property_id = p.id AND is_cover = TRUE LIMIT 1) AS cover_image,
              u.full_name AS guest_name, u.email AS guest_email, u.phone AS guest_phone
       FROM reservation_bookings b
       JOIN reservation_properties p ON b.property_id = p.id
       JOIN users u ON b.guest_id = u.id
       WHERE p.user_id = $1 AND b.status = 'confirmed'
       ORDER BY b.check_in ASC`,
      [req.user.userId]
    );
    res.json(rows.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/reservation/properties/:id/reactivate — owner reactivates paused property
router.patch("/properties/:id/reactivate", authenticateToken, async (req, res) => {
  try {
    const check = await db.query("SELECT user_id FROM reservation_properties WHERE id = $1", [req.params.id]);
    if (!check.rows[0]) return res.status(404).json({ error: "Bien non trouvé" });
    if (check.rows[0].user_id !== req.user.userId) return res.status(403).json({ error: "Accès refusé" });
    await db.query("UPDATE reservation_properties SET status='active', updated_at=NOW() WHERE id=$1", [req.params.id]);
    res.json({ message: "Bien réactivé avec succès" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// POST /api/reservation/properties/:id/reviews
router.post("/properties/:id/reviews", authenticateToken, async (req, res) => {
  try {
    const { booking_id, rating, comment, cleanliness_rating, location_rating, value_rating, communication_rating } = req.body;

    if (!booking_id || !rating) return res.status(400).json({ error: "Booking ID et note requis" });

    // Verify user booked this property
    const b = await db.query(
      "SELECT id FROM reservation_bookings WHERE id = $1 AND guest_id = $2 AND property_id = $3 AND status = 'completed'",
      [booking_id, req.user.userId, req.params.id]
    );
    if (!b.rows[0]) return res.status(403).json({ error: "Vous devez avoir séjourné ici pour donner un avis" });

    await db.query(
      `INSERT INTO reservation_reviews (property_id, booking_id, reviewer_id, rating, comment, cleanliness_rating, location_rating, value_rating, communication_rating)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       ON CONFLICT (booking_id, reviewer_id) DO NOTHING`,
      [req.params.id, booking_id, req.user.userId, rating, comment, cleanliness_rating, location_rating, value_rating, communication_rating]
    );

    // Recalculate avg rating
    await db.query(
      `UPDATE reservation_properties SET
         rating_avg = (SELECT ROUND(AVG(rating)::numeric, 2) FROM reservation_reviews WHERE property_id = $1),
         review_count = (SELECT COUNT(*) FROM reservation_reviews WHERE property_id = $1)
       WHERE id = $1`,
      [req.params.id]
    );

    res.status(201).json({ message: "Avis ajouté" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/reservation/stats — owner stats
router.get("/stats", authenticateToken, async (req, res) => {
  try {
    const [propRow, bookRow, revenueRow] = await Promise.all([
      db.query("SELECT COUNT(*) FROM reservation_properties WHERE user_id = $1", [req.user.userId]),
      db.query(
        `SELECT COUNT(*) FROM reservation_bookings b
         JOIN reservation_properties p ON b.property_id = p.id
         WHERE p.user_id = $1 AND b.status IN ('confirmed','pending')`,
        [req.user.userId]
      ),
      db.query(
        `SELECT COALESCE(SUM(b.total_price), 0) AS total
         FROM reservation_bookings b
         JOIN reservation_properties p ON b.property_id = p.id
         WHERE p.user_id = $1 AND b.status = 'completed'`,
        [req.user.userId]
      ),
    ]);

    res.json({
      properties: parseInt(propRow.rows[0].count),
      active_bookings: parseInt(bookRow.rows[0].count),
      total_revenue: parseFloat(revenueRow.rows[0].total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── ADMIN ROUTES ─────────────────────────────────────────────────────────────

// GET /api/reservation/admin/stats — global stats for admin
router.get("/admin/stats", authenticateToken, requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const [totalProps, pendingProps, totalBookings, pendingBookings, revenueRow] = await Promise.all([
      db.query("SELECT COUNT(*) FROM reservation_properties"),
      db.query("SELECT COUNT(*) FROM reservation_properties WHERE status = 'pending'"),
      db.query("SELECT COUNT(*) FROM reservation_bookings"),
      db.query("SELECT COUNT(*) FROM reservation_bookings WHERE status = 'pending'"),
      db.query("SELECT COALESCE(SUM(total_price), 0) AS total FROM reservation_bookings WHERE status = 'completed'"),
    ]);
    res.json({
      total_properties: parseInt(totalProps.rows[0].count),
      pending_properties: parseInt(pendingProps.rows[0].count),
      total_bookings: parseInt(totalBookings.rows[0].count),
      pending_bookings: parseInt(pendingBookings.rows[0].count),
      total_revenue: parseFloat(revenueRow.rows[0].total),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/reservation/admin/properties — all properties (any status)
router.get("/admin/properties", authenticateToken, requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let where = [];
    let params = [];
    let i = 1;

    if (status && status !== "all") { where.push(`p.status = $${i}`); params.push(status); i++; }
    if (search) { where.push(`(p.title ILIKE $${i} OR p.city ILIKE $${i} OR u.full_name ILIKE $${i})`); params.push(`%${search}%`); i++; }

    const whereStr = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows, countRow] = await Promise.all([
      db.query(
        `SELECT p.id, p.title, p.city, p.property_type, p.listing_type, p.status, p.is_featured,
                p.price_per_night, p.price_per_week, p.price_per_month, p.currency,
                p.bedrooms, p.max_guests, p.rating_avg, p.review_count, p.view_count, p.created_at,
                u.full_name AS owner_name, u.email AS owner_email,
                (SELECT image_url FROM reservation_property_images WHERE property_id = p.id AND is_cover = TRUE LIMIT 1) AS cover_image,
                (SELECT COUNT(*) FROM reservation_bookings WHERE property_id = p.id) AS booking_count
         FROM reservation_properties p
         JOIN users u ON p.user_id = u.id
         ${whereStr}
         ORDER BY p.created_at DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limitNum, offset]
      ),
      db.query(
        `SELECT COUNT(*) FROM reservation_properties p JOIN users u ON p.user_id = u.id ${whereStr}`,
        params
      ),
    ]);

    res.json({
      properties: rows.rows,
      total: parseInt(countRow.rows[0].count),
      page: pageNum,
      pages: Math.ceil(parseInt(countRow.rows[0].count) / limitNum),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/reservation/admin/properties/:id/status — approve / reject / feature
router.patch("/admin/properties/:id/status", authenticateToken, requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const { status, is_featured } = req.body;
    const allowed = ["active", "pending", "rejected", "inactive"];
    if (status && !allowed.includes(status)) {
      return res.status(400).json({ error: "Statut invalide" });
    }
    const fields = [];
    const vals = [];
    let i = 1;
    if (status !== undefined) { fields.push(`status = $${i}`); vals.push(status); i++; }
    if (is_featured !== undefined) { fields.push(`is_featured = $${i}`); vals.push(is_featured); i++; }
    if (!fields.length) return res.status(400).json({ error: "Rien à mettre à jour" });
    fields.push("updated_at = NOW()");
    vals.push(req.params.id);
    await db.query(`UPDATE reservation_properties SET ${fields.join(", ")} WHERE id = $${i}`, vals);
    res.json({ message: "Propriété mise à jour" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// GET /api/reservation/admin/bookings — all bookings
router.get("/admin/bookings", authenticateToken, requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const offset = (pageNum - 1) * limitNum;

    let where = [];
    let params = [];
    let i = 1;

    if (status && status !== "all") { where.push(`b.status = $${i}`); params.push(status); i++; }
    if (search) {
      where.push(`(p.title ILIKE $${i} OR g.full_name ILIKE $${i} OR g.email ILIKE $${i})`);
      params.push(`%${search}%`); i++;
    }

    const whereStr = where.length ? `WHERE ${where.join(" AND ")}` : "";

    const [rows, countRow] = await Promise.all([
      db.query(
        `SELECT b.id, b.status, b.check_in, b.check_out, b.nights_count, b.guests_count,
                b.total_price, b.currency, b.payment_method, b.guest_message, b.created_at,
                p.title AS property_title, p.city AS property_city, p.property_type,
                (SELECT image_url FROM reservation_property_images WHERE property_id = p.id AND is_cover = TRUE LIMIT 1) AS cover_image,
                g.full_name AS guest_name, g.email AS guest_email, g.phone AS guest_phone,
                o.full_name AS owner_name, o.email AS owner_email
         FROM reservation_bookings b
         JOIN reservation_properties p ON b.property_id = p.id
         JOIN users g ON b.guest_id = g.id
         JOIN users o ON p.user_id = o.id
         ${whereStr}
         ORDER BY b.created_at DESC
         LIMIT $${i} OFFSET $${i + 1}`,
        [...params, limitNum, offset]
      ),
      db.query(
        `SELECT COUNT(*) FROM reservation_bookings b
         JOIN reservation_properties p ON b.property_id = p.id
         JOIN users g ON b.guest_id = g.id
         JOIN users o ON p.user_id = o.id
         ${whereStr}`,
        params
      ),
    ]);

    res.json({
      bookings: rows.rows,
      total: parseInt(countRow.rows[0].count),
      page: pageNum,
      pages: Math.ceil(parseInt(countRow.rows[0].count) / limitNum),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// PATCH /api/reservation/admin/bookings/:id/status — force update booking status
router.patch("/admin/bookings/:id/status", authenticateToken, requireRole("admin", "super_admin"), async (req, res) => {
  try {
    const { status } = req.body;
    const allowed = ["pending", "confirmed", "rejected", "cancelled", "completed"];
    if (!allowed.includes(status)) return res.status(400).json({ error: "Statut invalide" });

    await db.query("UPDATE reservation_bookings SET status=$1, updated_at=NOW() WHERE id=$2", [status, req.params.id]);

    if (["cancelled", "rejected"].includes(status)) {
      await db.query("DELETE FROM reservation_availability WHERE booking_id = $1", [req.params.id]);
    }

    res.json({ message: "Réservation mise à jour" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

// ─── END ADMIN ROUTES ──────────────────────────────────────────────────────────

// PUT /api/reservation/properties/:id/availability — block/unblock dates
router.put("/properties/:id/availability", authenticateToken, async (req, res) => {
  try {
    const { blocked_dates, unblock_dates } = req.body;

    const check = await db.query("SELECT user_id FROM reservation_properties WHERE id = $1", [req.params.id]);
    if (!check.rows[0] || check.rows[0].user_id !== req.user.userId) {
      return res.status(403).json({ error: "Accès refusé" });
    }

    if (blocked_dates?.length) {
      for (const date of blocked_dates) {
        await db.query(
          "INSERT INTO reservation_availability (property_id, blocked_date, reason) VALUES ($1,$2,'owner_block') ON CONFLICT DO NOTHING",
          [req.params.id, date]
        );
      }
    }
    if (unblock_dates?.length) {
      await db.query(
        "DELETE FROM reservation_availability WHERE property_id = $1 AND blocked_date = ANY($2) AND reason = 'owner_block'",
        [req.params.id, unblock_dates]
      );
    }

    res.json({ message: "Disponibilités mises à jour" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Erreur serveur" });
  }
});

module.exports = router;

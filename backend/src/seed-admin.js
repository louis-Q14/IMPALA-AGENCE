const bcrypt = require("bcrypt");
const db = require("./db");

async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL || "louis.quatorze@impala-agence.com";
  const password = process.env.SEED_ADMIN_PASSWORD;
  const fullName = process.env.SEED_ADMIN_NAME || "Louis-Quatorze";
  const role = "super_admin";

  if (!password) {
    console.error("SEED_ADMIN_PASSWORD env variable is required.");
    process.exit(1);
  }

  try {
    // Check if admin already exists
    const existing = await db.query("SELECT id FROM users WHERE email = $1", [email]);
    if (existing.rows.length > 0) {
      console.log("Super admin already exists, updating password...");
      const hash = await bcrypt.hash(password, 12);
      await db.query("UPDATE users SET password_hash = $1, role = 'super_admin', status = 'approved', is_verified = true WHERE email = $2", [hash, email]);
      console.log("Password updated.");
    } else {
      const hash = await bcrypt.hash(password, 12);
      await db.query(
        `INSERT INTO users (email, password_hash, full_name, phone, role, status, is_verified)
         VALUES ($1, $2, $3, $4, $5, 'approved', true)`,
        [email, hash, fullName, null, role]
      );
      console.log("Super admin created successfully!");
    }

    // Register all services for admin
    const services = ["real_estate", "auto", "trash"];
    for (const svc of services) {
      await db.query(
        `INSERT INTO user_services (user_id, service_type, subscription_status)
         SELECT u.id, $2, 'active' FROM users u WHERE u.email = $1
         ON CONFLICT DO NOTHING`,
        [email, svc]
      );
    }
    console.log("All services activated for super admin.");

    console.log("\n--- Super Admin Credentials ---");
    console.log(`Email:    ${email}`);
    console.log("Password: (set via SEED_ADMIN_PASSWORD env variable)");
    console.log(`Role:     ${role}`);
    console.log("-------------------------------\n");
  } catch (err) {
    console.error("Seed error:", err.message);
  } finally {
    process.exit(0);
  }
}

seedAdmin();

require("dotenv").config();
const { Pool } = require("pg");
const fs = require("fs");
const path = require("path");

async function initDb() {
  const pool = new Pool({
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME || "impala_agence",
    user: process.env.DB_USER || "admin",
    password: process.env.DB_PASSWORD || "password",
  });

  try {
    // Run main schema
    const schemaPath = path.join(__dirname, "schema.sql");
    const schema = fs.readFileSync(schemaPath, "utf8");
    await pool.query(schema);
    console.log("Main schema initialized successfully");

    // Run additional migration SQL files
    const migrationFiles = [
      "migrate-users-columns.sql",
      "migrate-blog.sql",
      "migrate-boutique.sql",
      "migrate-contact.sql",
      "migrate-discounts.sql",
      "migrate-email-verify.sql",
      "migrate-otp.sql",
      "migrate-reset-password.sql",
      "migrate-subs.sql",
      "migrate-reset-superadmin.sql",
    ];

    for (const file of migrationFiles) {
      const filePath = path.join(__dirname, file);
      if (fs.existsSync(filePath)) {
        try {
          const sql = fs.readFileSync(filePath, "utf8");
          await pool.query(sql);
          console.log(`Migration applied: ${file}`);
        } catch (e) {
          console.log(`Migration skipped (${file}): ${e.message}`);
        }
      }
    }
  } catch (error) {
    if (error.code === "42P07") {
      console.log("Schema already exists, skipping initialization");
    } else {
      console.error("Database initialization error:", error.message);
      throw error;
    }
  } finally {
    await pool.end();
  }
}

module.exports = { initDb };

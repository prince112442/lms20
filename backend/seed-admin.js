// seed-admin.js
// Run once to create your first admin login:
// node seed-admin.js

require("dotenv").config();

console.log("==================================");
console.log("Database Configuration");
console.log("==================================");
console.log("DB_HOST:", process.env.DB_HOST);
console.log("DB_PORT:", process.env.DB_PORT);
console.log("DB_NAME:", process.env.DB_NAME);
console.log("DB_USER:", process.env.DB_USER);
console.log("==================================");

const bcrypt = require("bcryptjs");
const pool = require("./config/db");

const ADMIN = {
  full_name: "Admin User",
  email: "admin@library.edu",
  password: "ChangeMe123!"
};

(async () => {
  try {
    console.log("Connecting to database...");

    // Check connection
    const conn = await pool.getConnection();
    console.log("✅ Database connected successfully!");
    conn.release();

    // Check SUPER_ADMIN role
    const [roles] = await pool.query(
      "SELECT id FROM roles WHERE name = ?",
      ["SUPER_ADMIN"]
    );

    if (roles.length === 0) {
      throw new Error(
        "SUPER_ADMIN role not found. Import backend-sql/schema.sql first."
      );
    }

    const roleId = roles[0].id;

    // Check if admin already exists
    const [users] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [ADMIN.email]
    );

    if (users.length > 0) {
      console.log("✅ Admin already exists.");
      process.exit(0);
    }

    const hash = await bcrypt.hash(ADMIN.password, 10);

    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role_id)
       VALUES (?, ?, ?, ?)`,
      [ADMIN.full_name, ADMIN.email, hash, roleId]
    );

    console.log("==================================");
    console.log("✅ ADMIN CREATED SUCCESSFULLY");
    console.log("Email:", ADMIN.email);
    console.log("Password:", ADMIN.password);
    console.log("==================================");

  } catch (err) {
    console.log("==================================");
    console.log("❌ SEED FAILED");
    console.log("==================================");
    console.error(err);
    console.log("==================================");
  } finally {
    try {
      await pool.end();
    } catch {}
    process.exit();
  }
})();
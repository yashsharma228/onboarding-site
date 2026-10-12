import pool from "../config/db.js";

async function initClientsTable() {
  try {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS clients (
        id INT AUTO_INCREMENT PRIMARY KEY,
        login_id VARCHAR(50) UNIQUE NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        business_type VARCHAR(100) NULL,
        contact_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        source ENUM('signup_form', 'admin') DEFAULT 'signup_form',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;

    await pool.query(createTableQuery);
    const [cols] = await pool.query("DESCRIBE clients");
    console.log("clients table created/verified successfully:", cols.map(c => `${c.Field} (${c.Type})`));
    process.exit(0);
  } catch (err) {
    console.error("Failed to create clients table:", err.message);
    process.exit(1);
  }
}

initClientsTable();

import pool from "../config/db.js";

async function initPlansAndTerms() {
  try {
    // 1. Create plans table with only title, description, currency, price
    const createPlansTable = `
      CREATE TABLE IF NOT EXISTS plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        currency VARCHAR(10) NOT NULL DEFAULT 'INR',
        price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(createPlansTable);
    console.log("plans table created/verified successfully.");

    // 2. Create terms_and_conditions table
    const createTermsTable = `
      CREATE TABLE IF NOT EXISTS terms_and_conditions (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) DEFAULT 'Terms and Conditions',
        content LONGTEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    await pool.query(createTermsTable);
    console.log("terms_and_conditions table created/verified successfully.");

    process.exit(0);
  } catch (error) {
    console.error("Initialization error:", error.message);
    process.exit(1);
  }
}

initPlansAndTerms();

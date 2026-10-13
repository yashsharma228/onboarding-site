import pool from "../config/db.js";

async function initClientAccountsTables() {
  try {
    console.log("[Migration] Initializing Client Accounts schema...");

    // 1. Ensure `clients` table has is_archived, signature columns, notes
    const [clientCols] = await pool.query("DESCRIBE clients");
    const colNames = clientCols.map((c) => c.Field);

    if (!colNames.includes("direct_token")) {
      await pool.query("ALTER TABLE clients ADD COLUMN direct_token VARCHAR(255) NULL UNIQUE AFTER password_hash");
      console.log("Added column `direct_token` to `clients` table.");
    }

    if (!colNames.includes("is_archived")) {
      await pool.query("ALTER TABLE clients ADD COLUMN is_archived TINYINT(1) DEFAULT 0 AFTER project_status");
      console.log("Added column `is_archived` to `clients` table.");
    }

    if (!colNames.includes("signature_date")) {
      await pool.query("ALTER TABLE clients ADD COLUMN signature_date DATETIME NULL AFTER signature_status");
      console.log("Added column `signature_date` to `clients` table.");
    }

    if (!colNames.includes("signature_name")) {
      await pool.query("ALTER TABLE clients ADD COLUMN signature_name VARCHAR(255) NULL AFTER signature_date");
      console.log("Added column `signature_name` to `clients` table.");
    }

    if (!colNames.includes("notes")) {
      await pool.query("ALTER TABLE clients ADD COLUMN notes TEXT NULL AFTER is_archived");
      console.log("Added column `notes` to `clients` table.");
    }

    // 2. Create `client_plans` junction table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_plans (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        plan_id INT NOT NULL,
        plan_title VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_client (client_id),
        INDEX idx_plan (plan_id),
        UNIQUE KEY uq_client_plan (client_id, plan_id),
        CONSTRAINT fk_client_plans_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
        CONSTRAINT fk_client_plans_plan FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Verified `client_plans` table.");

    // 3. Create `client_payments` table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_payments (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
        transaction_id VARCHAR(100) NULL,
        status ENUM('Successful', 'Pending', 'Failed') DEFAULT 'Successful',
        payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        notes VARCHAR(255) NULL,
        INDEX idx_payment_client (client_id),
        CONSTRAINT fk_client_payments_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Verified `client_payments` table.");

    // 4. Create `client_activities` table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS client_activities (
        id INT AUTO_INCREMENT PRIMARY KEY,
        client_id INT NOT NULL,
        activity_type VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_activity_client (client_id),
        CONSTRAINT fk_client_activities_client FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log("Verified `client_activities` table.");

    // 5. Check if plans table has starter/growth demo plans or ensure we have plans for assignment
    const [existingPlans] = await pool.query("SELECT id, title, price, currency FROM plans");
    if (existingPlans.length < 2) {
      await pool.query(`
        INSERT IGNORE INTO plans (title, description, currency, price)
        VALUES 
        ('Starter Package', 'Foundational onboarding setup and initial digital identity integration.', 'INR', 25000.00),
        ('Growth Accelerator', 'Complete business scale-up package with dedicated portal and priority support.', 'INR', 50000.00)
      `);
      console.log("Added baseline Starter and Growth plans for demonstration.");
    }

    // 6. Seed demo sample data for the example row requested by user if not existing:
    // "ABC Technologies | Rahul Sharma · APX-4821 | rahul@example.com | Signed | Starter, Growth | Total: 50,000 | Paid: 25,000 | Pending: 25,000 | In Progress"
    const [abcRows] = await pool.query("SELECT id FROM clients WHERE login_id = 'APX-4821'");
    if (abcRows.length === 0) {
      const [allPlans] = await pool.query("SELECT id, title, price, currency FROM plans");
      const starterPlan = allPlans.find(p => p.title.toLowerCase().includes("starter")) || allPlans[0];
      const growthPlan = allPlans.find(p => p.title.toLowerCase().includes("growth")) || allPlans[1] || allPlans[0];

      const [insertClient] = await pool.query(`
        INSERT INTO clients (login_id, company_name, business_type, contact_name, email, password_hash, source, signature_status, signature_date, signature_name, project_status, is_archived)
        VALUES ('APX-4821', 'ABC Technologies', 'Information Technology', 'Rahul Sharma', 'rahul@example.com', '$2b$10$35Yl03BISmfYnxP2c4raa.NmNHct3phfXyNuEqogH4WEl/MprzsxG', 'signup_form', 'Signed', NOW(), 'Rahul Sharma', 'In Progress', 0)
      `);
      const newClientId = insertClient.insertId;

      // Assign plans: Starter (25,000) and Growth (25,000) => Total = 50,000
      if (starterPlan) {
        await pool.query(
          "INSERT IGNORE INTO client_plans (client_id, plan_id, price_at_assignment) VALUES (?, ?, ?)",
          [newClientId, starterPlan.id, 25000.00]
        );
      }
      if (growthPlan && growthPlan.id !== starterPlan?.id) {
        await pool.query(
          "INSERT IGNORE INTO client_plans (client_id, plan_id, price_at_assignment) VALUES (?, ?, ?)",
          [newClientId, growthPlan.id, 25000.00]
        );
      }

      // Add Payment: 25,000 received => Paid = 25,000, Pending = 25,000
      await pool.query(`
        INSERT INTO client_payments (client_id, amount, currency, payment_method, transaction_id, status, notes)
        VALUES (?, 25000.00, 'INR', 'UPI Transfer', 'TXN-APX-849201', 'Successful', 'Advance payment 50% received')
      `, [newClientId]);

      // Activities
      await pool.query(`
        INSERT INTO client_activities (client_id, activity_type, description)
        VALUES 
        (?, 'Account Created', 'Client approved and onboarded successfully.'),
        (?, 'Agreement Signed', 'Digital onboarding agreement signed by Rahul Sharma.'),
        (?, 'Plan Assigned', 'Assigned plans: Starter Package, Growth Accelerator.'),
        (?, 'Payment Recorded', 'Received advance payment of ₹25,000 via UPI (TXN-APX-849201).')
      `, [newClientId, newClientId, newClientId, newClientId]);

      console.log("Seeded demo client 'ABC Technologies' (APX-4821) matching user specification.");
    }

    // 7. Seed activities for existing clients if empty
    const [existingClients] = await pool.query("SELECT id, company_name, contact_name FROM clients");
    for (const c of existingClients) {
      const [acts] = await pool.query("SELECT id FROM client_activities WHERE client_id = ?", [c.id]);
      if (acts.length === 0) {
        await pool.query(
          "INSERT INTO client_activities (client_id, activity_type, description) VALUES (?, 'Account Created', ?)",
          [c.id, `Client account created for ${c.company_name} (${c.contact_name}).`]
        );
      }
    }

    console.log("Client Accounts migration and setup completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  }
}

initClientAccountsTables();

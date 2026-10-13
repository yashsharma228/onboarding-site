import "dotenv/config";
import app from "./app.js";
<<<<<<< HEAD
import pool from "./config/db.js";

const PORT = process.env.PORT || 5000;

// Verify and auto-migrate critical columns on boot
(async () => {
  try {
    const [cols] = await pool.query("DESCRIBE clients");
    const colNames = cols.map((c) => c.Field);
    if (!colNames.includes("direct_token")) {
      await pool.query("ALTER TABLE clients ADD COLUMN direct_token VARCHAR(255) NULL UNIQUE AFTER password_hash");
      console.log("[DB] Added `direct_token` column to `clients` table.");
    }
  } catch (err) {
    console.warn("[DB] Startup schema verification note:", err.message);
  }
})();

=======

const PORT = process.env.PORT || 5000;

>>>>>>> 327cb1d9f08a9dd93004fcfb625bb7a799ad95ac
const server = app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
});

server.on("error", (err) => {
  console.error("Server error:", err.message);
});

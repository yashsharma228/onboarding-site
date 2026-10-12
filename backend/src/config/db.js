import mysql from "mysql2/promise";
import "dotenv/config";

const requiredKeys = ["DB_HOST", "DB_PORT", "DB_USER", "DB_NAME"];
for (const key of requiredKeys) {
  if (!process.env[key] || process.env[key].trim() === "") {
    throw new Error(`[Config Error] Missing required database environment variable: ${key}`);
  }
}

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD !== undefined ? process.env.DB_PASSWORD : "",
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool;

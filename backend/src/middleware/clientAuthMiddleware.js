import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const authenticateClient = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authorization token required." });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("Missing JWT_SECRET in environment variables.");
    }

    let decoded;
    try {
      decoded = jwt.verify(token, secret);
    } catch (err) {
      return res.status(401).json({ success: false, message: "Invalid or expired session token." });
    }

    if (decoded.role !== "client") {
      return res.status(403).json({ success: false, message: "Unauthorized access: client token required." });
    }

    const [rows] = await pool.query(
      `SELECT id, login_id, company_name, contact_name, email, business_type, signature_status, project_status, is_archived, created_at 
       FROM clients 
       WHERE id = ? AND is_archived = 0`,
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: "Client account not found or deactivated." });
    }

    req.client = rows[0];
    next();
  } catch (error) {
    console.error("Client auth middleware error:", error);
    return res.status(500).json({ success: false, message: "Authentication failure." });
  }
};

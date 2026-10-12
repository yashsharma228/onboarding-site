import jwt from "jsonwebtoken";
import pool from "../config/db.js";

export const authenticateAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ success: false, message: "Authorization token required." });
    }

    const token = authHeader.split(" ")[1];
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      return res.status(500).json({ success: false, message: "Server configuration error: JWT_SECRET not configured." });
    }

    const decoded = jwt.verify(token, secret);

    const [admins] = await pool.query(
      "SELECT id, username, email, full_name FROM admins WHERE id = ?",
      [decoded.id]
    );

    if (admins.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid session. Admin account not found." });
    }

    req.admin = admins[0];
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ success: false, message: "Session expired. Please log in again." });
    }
    return res.status(401).json({ success: false, message: "Invalid authorization token." });
  }
};

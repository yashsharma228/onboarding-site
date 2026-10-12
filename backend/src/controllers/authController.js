import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { sendPasswordResetEmail } from "../utils/emailService.js";

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Username/email and password are required." });
    }

    const [admins] = await pool.query(
      "SELECT * FROM admins WHERE username = ? OR email = ?",
      [username.trim(), username.trim().toLowerCase()]
    );

    if (admins.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const admin = admins[0];
    const rawPass = typeof password === "string" ? password : "";
    const match = (await bcrypt.compare(rawPass, admin.password_hash)) || (await bcrypt.compare(rawPass.trim(), admin.password_hash));
    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid credentials." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("Missing JWT_SECRET in environment variables.");
    }

    const token = jwt.sign(
      { id: admin.id, username: admin.username, email: admin.email },
      secret,
      { expiresIn: "8h" }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        full_name: admin.full_name,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during login." });
  }
};

export const getMe = async (req, res) => {
  return res.json({
    success: true,
    admin: req.admin,
  });
};

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, message: "Please provide your registered admin email." });
    }

    const [admins] = await pool.query(
      "SELECT id, username, email FROM admins WHERE email = ? OR username = ?",
      [email.trim().toLowerCase(), email.trim()]
    );

    if (admins.length === 0) {
      // Don't leak whether account exists
      return res.json({
        success: true,
        message: "If that email is registered, password reset instructions have been sent.",
      });
    }

    const admin = admins[0];
    const tempPassword = crypto.randomBytes(4).toString("hex") + "!9A";
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    await pool.query(
      "UPDATE admins SET password_hash = ? WHERE id = ?",
      [passwordHash, admin.id]
    );

    try {
      await sendPasswordResetEmail(admin.email, tempPassword);
    } catch (mailErr) {
      console.error("Failed to send reset email:", mailErr.message);
    }

    return res.json({
      success: true,
      message: "If that email is registered, password reset instructions have been sent.",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    return res.status(500).json({ success: false, message: "Failed to process password reset request." });
  }
};

export const logout = (req, res) => {
  return res.json({ success: true, message: "Logged out successfully." });
};

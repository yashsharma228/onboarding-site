import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import pool from "../config/db.js";
import { sendClientPasswordResetEmail } from "../utils/emailService.js";

// POST /api/client/auth/login
export const clientLogin = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: "Login ID / email and password are required." });
    }

    const trimmedUser = username.trim();

    // Query clients table by login_id OR email
    const [clients] = await pool.query(
      "SELECT * FROM clients WHERE (login_id = ? OR email = ?) AND is_archived = 0",
      [trimmedUser, trimmedUser.toLowerCase()]
    );

    if (clients.length === 0) {
      return res.status(401).json({ success: false, message: "Invalid Login ID/email or password." });
    }

    const client = clients[0];
    const rawPass = typeof password === "string" ? password : "";
    const match =
      (await bcrypt.compare(rawPass, client.password_hash)) ||
      (await bcrypt.compare(rawPass.trim(), client.password_hash));

    if (!match) {
      return res.status(401).json({ success: false, message: "Invalid Login ID/email or password." });
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error("Missing JWT_SECRET in environment variables.");
    }

    // Sign production JWT token for client
    const token = jwt.sign(
      {
        id: client.id,
        login_id: client.login_id,
        email: client.email,
        company_name: client.company_name,
        role: "client",
      },
      secret,
      { expiresIn: "7d" }
    );

    return res.json({
      success: true,
      message: "Login successful.",
      token,
      client: {
        id: client.id,
        login_id: client.login_id,
        company_name: client.company_name,
        contact_name: client.contact_name,
        email: client.email,
        business_type: client.business_type,
        signature_status: client.signature_status,
        project_status: client.project_status,
      },
    });
  } catch (error) {
    console.error("Client login error:", error);
    return res.status(500).json({ success: false, message: "Internal server error during login." });
  }
};

// GET /api/client/auth/me
export const getClientMe = async (req, res) => {
  return res.json({
    success: true,
    client: req.client,
  });
};

// POST /api/client/auth/forgot-password
export const clientForgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ success: false, message: "Please provide your registered client email address." });
    }

    const trimmedEmail = email.trim().toLowerCase();

    const [clients] = await pool.query(
      "SELECT id, login_id, contact_name, company_name, email FROM clients WHERE email = ? AND is_archived = 0",
      [trimmedEmail]
    );

    if (clients.length === 0) {
      return res.json({
        success: true,
        message: "If that email is registered, password reset instructions have been sent.",
      });
    }

    const client = clients[0];
    const tempPassword = crypto.randomBytes(4).toString("hex") + "!9C";
    const passwordHash = await bcrypt.hash(tempPassword, 10);

    // Update password_hash in clients table
    await pool.query("UPDATE clients SET password_hash = ? WHERE id = ?", [passwordHash, client.id]);

    try {
      await sendClientPasswordResetEmail({
        toEmail: client.email,
        contactName: client.contact_name,
        companyName: client.company_name,
        loginId: client.login_id,
        tempPassword,
      });
    } catch (mailErr) {
      console.error("Failed to send client password reset email:", mailErr.message);
    }

    return res.json({
      success: true,
      message: "If that email is registered, password reset instructions have been sent to your email.",
    });
  } catch (error) {
    console.error("Client forgot password error:", error);
    return res.status(500).json({ success: false, message: "Failed to process password reset request." });
  }
};

// POST /api/client/auth/logout
export const clientLogout = (req, res) => {
  return res.json({ success: true, message: "Logged out successfully." });
};

import crypto from "crypto";
import bcrypt from "bcrypt";
import pool from "../config/db.js";
import { sendClientApprovalEmail, sendClientRejectionEmail } from "../utils/emailService.js";

// Helper to generate unique Login ID (e.g. APX-4821)
const generateUniqueLoginId = async () => {
  let loginId = "";
  let exists = true;
  while (exists) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    loginId = `APX-${randomDigits}`;
    const [adminRows] = await pool.query("SELECT id FROM admins WHERE username = ?", [loginId]);
    const [clientRows] = await pool.query("SELECT id FROM clients WHERE login_id = ?", [loginId]);
    if (adminRows.length === 0 && clientRows.length === 0) {
      exists = false;
    }
  }
  return loginId;
};

// Helper to generate secure random password
const generateRandomPassword = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

// List all client signups
export const getSignups = async (req, res) => {
  try {
    const { status } = req.query;
    let query = "SELECT * FROM client_signups";
    const params = [];

    if (status && ["Pending", "Approved", "Rejected"].includes(status)) {
      query += " WHERE status = ?";
      params.push(status);
    }

    query += " ORDER BY created_at DESC";

    const [rows] = await pool.query(query, params);
    return res.json({ success: true, count: rows.length, data: rows });
  } catch (error) {
    console.error("Get signups error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch signups." });
  }
};

// Update signup status (Approve / Reject)
export const updateSignupStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["Approved", "Rejected", "Pending"].includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Status must be 'Approved', 'Rejected', or 'Pending'.",
      });
    }

    const [existing] = await pool.query("SELECT * FROM client_signups WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Client signup record not found." });
    }

    const signup = existing[0];
    const reviewedAt = status === "Pending" ? null : new Date();

    let generatedLoginId = null;

    // When admin approves, auto-create/update credentials and client records
    if (status === "Approved") {
      const [existingAdmins] = await pool.query("SELECT * FROM admins WHERE email = ?", [signup.email]);
      let plainPassword = generateRandomPassword();
      let passwordHash = await bcrypt.hash(plainPassword, 10);

      if (existingAdmins.length === 0) {
        generatedLoginId = await generateUniqueLoginId();

        await pool.query(
          `INSERT INTO admins (username, email, full_name, password_hash)
           VALUES (?, ?, ?, ?)`,
          [
            generatedLoginId,
            signup.email,
            signup.contact_name,
            passwordHash,
          ]
        );
      } else {
        generatedLoginId = existingAdmins[0].username;
        await pool.query(
          "UPDATE admins SET password_hash = ?, full_name = ? WHERE id = ?",
          [
            passwordHash,
            signup.contact_name || existingAdmins[0].full_name,
            existingAdmins[0].id,
          ]
        );
      }

      // Also ensure client record in `clients` table is created/updated for Client Accounts list
      const [existingClients] = await pool.query("SELECT id, login_id FROM clients WHERE email = ?", [signup.email]);
      if (existingClients.length === 0) {
        let clientLoginId = generatedLoginId;
        const [dupCheck] = await pool.query("SELECT id FROM clients WHERE login_id = ?", [clientLoginId]);
        if (dupCheck.length > 0) {
          clientLoginId = await generateUniqueLoginId();
        }

        const [cRes] = await pool.query(
          `INSERT INTO clients (login_id, company_name, business_type, contact_name, email, password_hash, source, signature_status, project_status, is_archived)
           VALUES (?, ?, ?, ?, ?, ?, 'signup_form', 'Awaiting', 'Not Started', 0)`,
          [clientLoginId, signup.company_name, signup.business_type || null, signup.contact_name, signup.email, passwordHash]
        );
        await pool.query(
          "INSERT INTO client_activities (client_id, activity_type, description) VALUES (?, 'Account Approved', 'Client signup approved and account created.')",
          [cRes.insertId]
        );
      } else {
        const activeLoginId = existingClients[0].login_id || generatedLoginId;
        await pool.query(
          "UPDATE clients SET login_id = ?, company_name = ?, contact_name = ?, password_hash = ?, source = 'signup_form', is_archived = 0 WHERE id = ?",
          [activeLoginId, signup.company_name, signup.contact_name, passwordHash, existingClients[0].id]
        );
      }

      // Send automated welcome email with credentials
      try {
        await sendClientApprovalEmail({
          toEmail: signup.email,
          contactName: signup.contact_name,
          companyName: signup.company_name,
          loginId: generatedLoginId,
          password: plainPassword,
        });
      } catch (mailErr) {
        console.error("Failed to send client approval email:", mailErr.message);
      }
    }

    // When admin rejects, generate private client profile link and send rejection email
    if (status === "Rejected") {
      let token = null;
      const [existingClients] = await pool.query(
        "SELECT id, login_id, direct_token FROM clients WHERE email = ?",
        [signup.email]
      );

      if (existingClients.length > 0) {
        token = existingClients[0].direct_token;
        if (!token) {
          token = crypto.randomBytes(32).toString("hex");
          await pool.query("UPDATE clients SET direct_token = ? WHERE id = ?", [token, existingClients[0].id]);
        }
      } else {
        const clientLoginId = await generateUniqueLoginId();
        token = crypto.randomBytes(32).toString("hex");
        const randomPass = generateRandomPassword();
        const passwordHash = await bcrypt.hash(randomPass, 10);

        await pool.query(
          `INSERT INTO clients (login_id, company_name, business_type, contact_name, email, password_hash, direct_token, source, signature_status, project_status, is_archived)
           VALUES (?, ?, ?, ?, ?, ?, ?, 'signup_form', 'Awaiting', 'Not Started', 0)`,
          [
            clientLoginId,
            signup.company_name,
            signup.business_type || null,
            signup.contact_name,
            signup.email,
            passwordHash,
            token,
          ]
        );
      }

      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
      const directUrl = `${frontendUrl}/client/profile?token=${token}`;

      try {
        await sendClientRejectionEmail({
          toEmail: signup.email,
          contactName: signup.contact_name,
          companyName: signup.company_name,
          directUrl,
        });
      } catch (mailErr) {
        console.error("Failed to send client rejection email:", mailErr.message);
      }
    }

    await pool.query(
      "UPDATE client_signups SET status = ?, reviewed_at = ? WHERE id = ?",
      [status, reviewedAt, id]
    );

    const [updated] = await pool.query("SELECT * FROM client_signups WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: `${signup.company_name} has been marked as ${status}.`,
      data: updated[0],
      login_id: generatedLoginId,
    });
  } catch (error) {
    console.error("Update signup status error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to update signup status." });
  }
};

// Permanently delete a client signup
export const deleteSignup = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query("SELECT id, company_name FROM client_signups WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Client signup record not found." });
    }

    const companyName = existing[0].company_name || `Registration #${id}`;
    await pool.query("DELETE FROM client_signups WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: `${companyName} has been permanently deleted.`,
    });
  } catch (error) {
    console.error("Delete signup error:", error);
    return res.status(500).json({ success: false, message: "Failed to delete signup record." });
  }
};

// Get current admin profile
export const getProfile = async (req, res) => {
  try {
    const [rows] = await pool.query(
      "SELECT id, username, email, full_name, created_at, updated_at FROM admins WHERE id = ?",
      [req.admin.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Admin profile not found." });
    }

    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to load profile." });
  }
};

// Update admin profile details
export const updateProfile = async (req, res) => {
  try {
    const { full_name, email } = req.body;

    if (!full_name || !email) {
      return res.status(400).json({ success: false, message: "Full name and email are required." });
    }

    // Check email uniqueness across admins
    const [existing] = await pool.query(
      "SELECT id FROM admins WHERE email = ? AND id != ?",
      [email.trim().toLowerCase(), req.admin.id]
    );

    if (existing.length > 0) {
      return res.status(409).json({ success: false, message: "Email is already in use by another admin." });
    }

    await pool.query(
      "UPDATE admins SET full_name = ?, email = ? WHERE id = ?",
      [full_name.trim(), email.trim().toLowerCase(), req.admin.id]
    );

    const [updated] = await pool.query(
      "SELECT id, username, email, full_name, updated_at FROM admins WHERE id = ?",
      [req.admin.id]
    );

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      data: updated[0],
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile." });
  }
};

// Change password
export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required.",
      });
    }

    if (new_password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long.",
      });
    }

    const [admins] = await pool.query("SELECT password_hash FROM admins WHERE id = ?", [req.admin.id]);
    if (admins.length === 0) {
      return res.status(404).json({ success: false, message: "Admin not found." });
    }

    const match = await bcrypt.compare(current_password, admins[0].password_hash);
    if (!match) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query(
      "UPDATE admins SET password_hash = ? WHERE id = ?",
      [newHash, req.admin.id]
    );

    return res.json({
      success: true,
      message: "Password changed successfully.",
    });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ success: false, message: "Failed to update password." });
  }
};

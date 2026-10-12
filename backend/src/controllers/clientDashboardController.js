import bcrypt from "bcrypt";
import pool from "../config/db.js";

// GET /api/client/dashboard
export const getClientDashboardData = async (req, res) => {
  try {
    const clientId = req.client.id;

    // 1. Fetch assigned plans
    const [assignedPlans] = await pool.query(
      `SELECT 
        cp.id AS assignment_id,
        cp.plan_id,
        cp.price_at_assignment AS price,
        cp.created_at AS assigned_at,
        p.title,
        p.description,
        p.currency
       FROM client_plans cp
       JOIN plans p ON cp.plan_id = p.id
       WHERE cp.client_id = ?
       ORDER BY cp.created_at ASC`,
      [clientId]
    );

    // 2. Fetch payments history
    const [payments] = await pool.query(
      `SELECT id, amount, currency, payment_method, transaction_id, status, payment_date, notes
       FROM client_payments
       WHERE client_id = ?
       ORDER BY payment_date DESC`,
      [clientId]
    );

    // 3. Financial calculations
    const totalAmount = assignedPlans.reduce((sum, p) => sum + Number(p.price || 0), 0);
    const amountPaid = payments
      .filter((p) => p.status === "Successful")
      .reduce((sum, p) => sum + Number(p.amount || 0), 0);
    const amountPending = Math.max(0, totalAmount - amountPaid);

    return res.json({
      success: true,
      data: {
        profile: req.client,
        assigned_plans: assignedPlans,
        payments,
        finances: {
          totalAmount,
          amountPaid,
          amountPending,
          currency: assignedPlans[0]?.currency || "INR",
        },
      },
    });
  } catch (error) {
    console.error("Get client dashboard error:", error);
    return res.status(500).json({ success: false, message: "Failed to load dashboard data." });
  }
};

// GET /api/client/profile
export const getClientProfile = async (req, res) => {
  try {
    return res.json({
      success: true,
      data: req.client,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Failed to load profile." });
  }
};

// PUT /api/client/profile - Client updates profile (EMAIL CANNOT BE CHANGED)
export const updateClientProfile = async (req, res) => {
  try {
    const clientId = req.client.id;
    const { company_name, contact_name, business_type } = req.body;

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ success: false, message: "Company name is required." });
    }
    if (!contact_name || !contact_name.trim()) {
      return res.status(400).json({ success: false, message: "Contact person name is required." });
    }

    const trimmedCompany = company_name.trim();
    const trimmedContact = contact_name.trim();
    const trimmedBusiness = business_type ? business_type.trim() : null;

    // Email is strictly NOT updated in clients table
    await pool.query(
      "UPDATE clients SET company_name = ?, contact_name = ?, business_type = ? WHERE id = ?",
      [trimmedCompany, trimmedContact, trimmedBusiness, clientId]
    );

    const [updated] = await pool.query(
      `SELECT id, login_id, company_name, contact_name, email, business_type, signature_status, project_status, created_at, updated_at
       FROM clients WHERE id = ?`,
      [clientId]
    );

    return res.json({
      success: true,
      message: "Profile updated successfully.",
      data: updated[0],
    });
  } catch (error) {
    console.error("Update client profile error:", error);
    return res.status(500).json({ success: false, message: "Failed to update profile." });
  }
};

// PUT /api/client/change-password
export const changeClientPassword = async (req, res) => {
  try {
    const clientId = req.client.id;
    const { current_password, new_password } = req.body;

    if (!current_password || !new_password) {
      return res.status(400).json({ success: false, message: "Current password and new password are required." });
    }

    if (new_password.length < 6) {
      return res.status(400).json({ success: false, message: "New password must be at least 6 characters long." });
    }

    // Verify current password from clients table
    const [rows] = await pool.query("SELECT password_hash FROM clients WHERE id = ?", [clientId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const match = await bcrypt.compare(current_password, rows[0].password_hash);
    if (!match) {
      return res.status(400).json({ success: false, message: "Current password is incorrect." });
    }

    const newHash = await bcrypt.hash(new_password, 10);
    await pool.query("UPDATE clients SET password_hash = ? WHERE id = ?", [newHash, clientId]);

    return res.json({
      success: true,
      message: "Password updated successfully.",
    });
  } catch (error) {
    console.error("Change client password error:", error);
    return res.status(500).json({ success: false, message: "Failed to change password." });
  }
};

import pool from "../config/db.js";
import bcrypt from "bcrypt";
import crypto from "crypto";
import { sendClientDirectLinkEmail } from "../utils/emailService.js";

// Helper to calculate payment status
const calculatePaymentStatus = (totalAmount, amountPaid) => {
  if (totalAmount <= 0) return "Not Paid";
  if (amountPaid >= totalAmount) return "Fully Paid";
  if (amountPaid > 0) return "Advance Paid";
  return "Not Paid";
};

// GET /api/admin/clients - Fetch all approved client accounts
export const getClients = async (req, res) => {
  try {
    const { search, payment_status, project_status, signature_status, archived, source } = req.query;

    const isArchived = archived === "true" || archived === "1" ? 1 : 0;

    // 1. Fetch base clients
    let query = `
      SELECT 
        c.id,
        c.login_id,
        c.company_name,
        c.business_type,
        c.contact_name,
        c.email,
        c.source,
        c.signature_status,
        c.signature_date,
        c.signature_name,
        c.project_status,
        c.is_archived,
        c.created_at,
        c.updated_at
      FROM clients c
      WHERE c.is_archived = ?
    `;
    const params = [isArchived];

    if (source && ["signup_form", "admin"].includes(source)) {
      if (source === "signup_form") {
        query += " AND (c.source = 'signup_form' OR c.source IS NULL OR c.source = '')";
      } else {
        query += " AND c.source = ?";
        params.push(source);
      }
    }

    if (project_status && ["Not Started", "In Progress", "Completed"].includes(project_status)) {
      query += " AND c.project_status = ?";
      params.push(project_status);
    }

    if (signature_status && ["Awaiting", "Signed"].includes(signature_status)) {
      query += " AND c.signature_status = ?";
      params.push(signature_status);
    }

    query += " ORDER BY c.created_at DESC";

    const [clients] = await pool.query(query, params);

    if (clients.length === 0) {
      return res.json({ success: true, count: 0, data: [] });
    }

    const clientIds = clients.map((c) => c.id);

    // 2. Fetch assigned plans for all these clients
    const [assignedPlans] = await pool.query(
      `
      SELECT 
        cp.client_id,
        cp.plan_id,
        cp.price_at_assignment AS price,
        cp.created_at AS assigned_at,
        p.title,
        p.description,
        p.currency
      FROM client_plans cp
      JOIN plans p ON cp.plan_id = p.id
      WHERE cp.client_id IN (?)
      ORDER BY cp.created_at ASC
    `,
      [clientIds]
    );

    // Group plans by client_id
    const plansByClient = {};
    for (const p of assignedPlans) {
      if (!plansByClient[p.client_id]) {
        plansByClient[p.client_id] = [];
      }
      plansByClient[p.client_id].push({
        id: p.plan_id,
        title: p.title,
        price: Number(p.price),
        currency: p.currency || "INR",
        assigned_at: p.assigned_at,
      });
    }

    // 3. Fetch successful payments sum for these clients
    const [paymentSums] = await pool.query(
      `
      SELECT 
        client_id,
        COALESCE(SUM(amount), 0) AS total_paid
      FROM client_payments
      WHERE client_id IN (?) AND status = 'Successful'
      GROUP BY client_id
    `,
      [clientIds]
    );

    const paidByClient = {};
    for (const ps of paymentSums) {
      paidByClient[ps.client_id] = Number(ps.total_paid);
    }

    // 4. Combine and compute financial & status fields for each client
    let result = clients.map((client) => {
      const plans = plansByClient[client.id] || [];
      const planNames = plans.map((p) => p.title);
      const totalAmount = plans.reduce((sum, p) => sum + p.price, 0);
      const amountPaid = paidByClient[client.id] || 0;
      const amountPending = Math.max(0, totalAmount - amountPaid);
      const computedPaymentStatus = calculatePaymentStatus(totalAmount, amountPaid);

      return {
        id: client.id,
        company_name: client.company_name,
        contact_name: client.contact_name,
        email: client.email,
        login_id: client.login_id,
        business_type: client.business_type,
        source: client.source || "signup_form",
        assigned_plans: plans,
        assigned_plans_names: planNames,
        signature_status: client.signature_status || "Awaiting",
        signature_date: client.signature_date,
        signature_name: client.signature_name,
        payment_status: computedPaymentStatus,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        amount_pending: amountPending,
        currency: plans[0]?.currency || "INR",
        project_status: client.project_status || "Not Started",
        is_archived: Boolean(client.is_archived),
        created_at: client.created_at,
      };
    });

    // 5. Apply payment_status filter if requested
    if (payment_status && ["Not Paid", "Advance Paid", "Fully Paid"].includes(payment_status)) {
      result = result.filter((c) => c.payment_status === payment_status);
    }

    // 6. Apply search filter
    if (search && search.trim()) {
      const q = search.trim().toLowerCase();
      result = result.filter(
        (c) =>
          c.company_name?.toLowerCase().includes(q) ||
          c.contact_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.login_id?.toLowerCase().includes(q) ||
          c.assigned_plans_names.some((name) => name.toLowerCase().includes(q))
      );
    }

    return res.json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    console.error("Get clients error:", error);
    return res.status(500).json({ success: false, message: "Failed to load client accounts." });
  }
};

// GET /api/admin/clients/:id - Full details for View Modal
export const getClientById = async (req, res) => {
  try {
    const { id } = req.params;

    const [clients] = await pool.query("SELECT * FROM clients WHERE id = ?", [id]);
    if (clients.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const client = clients[0];

    // 1. Fetch assigned plans
    const [assignedPlans] = await pool.query(
      `
      SELECT 
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
      ORDER BY cp.created_at ASC
    `,
      [id]
    );

    // 2. Fetch payments history
    const [payments] = await pool.query(
      `
      SELECT 
        id,
        amount,
        currency,
        payment_method,
        transaction_id,
        status,
        payment_date,
        notes
      FROM client_payments
      WHERE client_id = ?
      ORDER BY payment_date DESC
    `,
      [id]
    );

    // 3. Fetch activity timeline
    const [activities] = await pool.query(
      `
      SELECT 
        id,
        activity_type,
        description,
        created_at
      FROM client_activities
      WHERE client_id = ?
      ORDER BY created_at DESC
    `,
      [id]
    );

    // 4. Fetch latest Terms & Conditions for agreement reference
    const [terms] = await pool.query("SELECT id, title, updated_at FROM terms_and_conditions LIMIT 1");

    // Computations
    const totalAmount = assignedPlans.reduce((sum, p) => sum + Number(p.price), 0);
    const amountPaid = payments
      .filter((p) => p.status === "Successful")
      .reduce((sum, p) => sum + Number(p.amount), 0);
    const amountPending = Math.max(0, totalAmount - amountPaid);
    const paymentStatus = calculatePaymentStatus(totalAmount, amountPaid);

    return res.json({
      success: true,
      data: {
        id: client.id,
        company_name: client.company_name,
        contact_name: client.contact_name,
        email: client.email,
        login_id: client.login_id,
        business_type: client.business_type,
        signature_status: client.signature_status || "Awaiting",
        signature_date: client.signature_date,
        signature_name: client.signature_name,
        project_status: client.project_status || "Not Started",
        is_archived: Boolean(client.is_archived),
        notes: client.notes,
        created_at: client.created_at,
        total_amount: totalAmount,
        amount_paid: amountPaid,
        amount_pending: amountPending,
        payment_status: paymentStatus,
        currency: assignedPlans[0]?.currency || "INR",
        assigned_plans: assignedPlans,
        payments,
        activities,
        agreement: {
          terms_id: terms[0]?.id || null,
          terms_title: terms[0]?.title || "Standard Terms & Agreement",
          terms_version_date: terms[0]?.updated_at || null,
          signed: client.signature_status === "Signed",
          signature_date: client.signature_date,
          signature_name: client.signature_name || client.contact_name,
        },
      },
    });
  } catch (error) {
    console.error("Get client details error:", error);
    return res.status(500).json({ success: false, message: "Failed to load client details." });
  }
};

// POST /api/admin/clients/:id/plans - Add / Assign Plans dynamically to client
export const assignPlans = async (req, res) => {
  try {
    const { id } = req.params;
    const { plan_ids } = req.body; // Array of plan IDs, e.g. [1, 3]

    if (!Array.isArray(plan_ids)) {
      return res.status(400).json({
        success: false,
        message: "plan_ids must be an array of plan IDs.",
      });
    }

    const [clientRows] = await pool.query("SELECT id, company_name FROM clients WHERE id = ?", [id]);
    if (clientRows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const client = clientRows[0];

    // If plan_ids is empty, remove all plans
    if (plan_ids.length === 0) {
      await pool.query("DELETE FROM client_plans WHERE client_id = ?", [id]);
      await pool.query(
        "INSERT INTO client_activities (client_id, activity_type, description) VALUES (?, 'Plan Updated', 'Removed all assigned plans.')",
        [id]
      );
      return res.json({ success: true, message: "All plans removed for this client." });
    }

    // Fetch details of selected plans
    const [selectedPlans] = await pool.query(
      "SELECT id, title, price, currency FROM plans WHERE id IN (?)",
      [plan_ids]
    );

    if (selectedPlans.length === 0) {
      return res.status(400).json({ success: false, message: "No valid plans found for the selected IDs." });
    }

    // Replace current plans with selected plans
    await pool.query("DELETE FROM client_plans WHERE client_id = ?", [id]);

    for (const plan of selectedPlans) {
      await pool.query(
        "INSERT INTO client_plans (client_id, plan_id, price_at_assignment) VALUES (?, ?, ?)",
        [id, plan.id, Number(plan.price)]
      );
    }

    const planTitles = selectedPlans.map((p) => p.title).join(", ");
    await pool.query(
      "INSERT INTO client_activities (client_id, activity_type, description) VALUES (?, 'Plan Assigned', ?)",
      [id, `Assigned plans: ${planTitles}.`]
    );

    return res.json({
      success: true,
      message: `Assigned plans (${planTitles}) saved successfully for ${client.company_name}.`,
    });
  } catch (error) {
    console.error("Assign plans error:", error);
    return res.status(500).json({ success: false, message: "Failed to assign plans." });
  }
};

// POST /api/admin/clients/:id/payments - Record a payment
export const recordPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, payment_method, transaction_id, notes, status } = req.body;

    const numAmount = Number(amount);
    if (!amount || isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ success: false, message: "Please provide a valid payment amount." });
    }

    const [clientRows] = await pool.query("SELECT id, company_name FROM clients WHERE id = ?", [id]);
    if (clientRows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const payStatus = status && ["Successful", "Pending", "Failed"].includes(status) ? status : "Successful";
    const payMethod = payment_method || "Bank Transfer";
    const txnId = transaction_id || `TXN-${Date.now()}`;

    await pool.query(
      `INSERT INTO client_payments (client_id, amount, payment_method, transaction_id, status, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, numAmount, payMethod, txnId, payStatus, notes || null]
    );

    await pool.query(
      "INSERT INTO client_activities (client_id, activity_type, description) VALUES (?, 'Payment Recorded', ?)",
      [id, `Payment of ₹${numAmount.toLocaleString()} recorded via ${payMethod} (${txnId}) - ${payStatus}.`]
    );

    return res.json({
      success: true,
      message: `Payment of ₹${numAmount.toLocaleString()} recorded successfully.`,
    });
  } catch (error) {
    console.error("Record payment error:", error);
    return res.status(500).json({ success: false, message: "Failed to record payment." });
  }
};

// PATCH /api/admin/clients/:id/status - Update Project Status or Signature Status
export const updateClientStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { project_status, signature_status, signature_name } = req.body;

    const [clientRows] = await pool.query("SELECT * FROM clients WHERE id = ?", [id]);
    if (clientRows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const updates = [];
    const params = [];
    const activities = [];

    if (project_status && ["Not Started", "In Progress", "Completed"].includes(project_status)) {
      updates.push("project_status = ?");
      params.push(project_status);
      activities.push(`Project status updated to '${project_status}'.`);
    }

    if (signature_status && ["Awaiting", "Signed"].includes(signature_status)) {
      updates.push("signature_status = ?");
      params.push(signature_status);

      if (signature_status === "Signed") {
        updates.push("signature_date = NOW()");
        updates.push("signature_name = ?");
        params.push(signature_name || clientRows[0].contact_name);
        activities.push(`Onboarding agreement signed by ${signature_name || clientRows[0].contact_name}.`);
      } else {
        updates.push("signature_date = NULL");
        updates.push("signature_name = NULL");
        activities.push("Signature status reset to 'Awaiting'.");
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: "No valid status fields provided to update." });
    }

    params.push(id);
    await pool.query(`UPDATE clients SET ${updates.join(", ")} WHERE id = ?`, params);

    for (const act of activities) {
      await pool.query(
        "INSERT INTO client_activities (client_id, activity_type, description) VALUES (?, 'Status Changed', ?)",
        [id, act]
      );
    }

    return res.json({
      success: true,
      message: "Client status updated successfully.",
    });
  } catch (error) {
    console.error("Update client status error:", error);
    return res.status(500).json({ success: false, message: "Failed to update client status." });
  }
};

// DELETE /api/admin/clients/:id - Intelligent delete/archive
// Prefers archiving if client has payments or signed agreements
export const deleteOrArchiveClient = async (req, res) => {
  try {
    const { id } = req.params;
    const { force } = req.query; // If force='true', permanently delete

    const [clientRows] = await pool.query("SELECT * FROM clients WHERE id = ?", [id]);
    if (clientRows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const client = clientRows[0];

    // Check payment history
    const [payments] = await pool.query(
      "SELECT id FROM client_payments WHERE client_id = ? AND status = 'Successful'",
      [id]
    );

    const hasFinancialRecords = payments.length > 0;
    const hasSignedAgreement = client.signature_status === "Signed";

    // If has payments or signed agreement, and not forced -> Archive
    if ((hasFinancialRecords || hasSignedAgreement) && force !== "true") {
      await pool.query("UPDATE clients SET is_archived = 1 WHERE id = ?", [id]);
      await pool.query(
        "INSERT INTO client_activities (client_id, activity_type, description) VALUES (?, 'Client Archived', 'Account archived to preserve financial and agreement history.')",
        [id]
      );

      const reason = hasFinancialRecords && hasSignedAgreement
        ? "recorded payments and signed agreement"
        : hasFinancialRecords
        ? "recorded payments"
        : "a signed agreement";

      return res.json({
        success: true,
        action: "archived",
        message: `${client.company_name} has been archived instead of deleted because this client has ${reason}. Financial and contract audit integrity preserved.`,
      });
    }

    // Otherwise permanently delete - clean up child associations first to ensure foreign key safety
    await pool.query("DELETE FROM client_plans WHERE client_id = ?", [id]);
    await pool.query("DELETE FROM client_payments WHERE client_id = ?", [id]);
    await pool.query("DELETE FROM client_activities WHERE client_id = ?", [id]);
    await pool.query("DELETE FROM clients WHERE id = ?", [id]);

    return res.json({
      success: true,
      action: "deleted",
      message: `${client.company_name} has been permanently deleted.`,
    });
  } catch (error) {
    console.error("Delete client error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to process client deletion." });
  }
};

// PATCH /api/admin/clients/:id/restore - Restore an archived client
export const restoreClient = async (req, res) => {
  try {
    const { id } = req.params;
    const [clientRows] = await pool.query("SELECT id, company_name FROM clients WHERE id = ?", [id]);
    if (clientRows.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    await pool.query("UPDATE clients SET is_archived = 0 WHERE id = ?", [id]);
    await pool.query(
      "INSERT INTO client_activities (client_id, activity_type, description) VALUES (?, 'Client Restored', 'Account restored from archived status.')",
      [id]
    );

    return res.json({
      success: true,
      message: `${clientRows[0].company_name} has been restored to active clients.`,
    });
  } catch (error) {
    console.error("Restore client error:", error);
    return res.status(500).json({ success: false, message: "Failed to restore client." });
  }
};

// Helper to generate unique Login ID (e.g. APX-4821)
const generateUniqueLoginId = async () => {
  let loginId = "";
  let exists = true;
  while (exists) {
    const randomDigits = Math.floor(1000 + Math.random() * 9000);
    loginId = `APX-${randomDigits}`;
    const [rows] = await pool.query("SELECT id FROM clients WHERE login_id = ?", [loginId]);
    if (rows.length === 0) {
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

// POST /api/admin/clients - Create Client with source='admin'
export const createClientByAdmin = async (req, res) => {
  try {
    const { company_name, contact_name, email, business_type, plan_ids, password } = req.body;

    if (!company_name || !company_name.trim()) {
      return res.status(400).json({ success: false, message: "Company name is required." });
    }
    if (!contact_name || !contact_name.trim()) {
      return res.status(400).json({ success: false, message: "Contact person name is required." });
    }
    if (!email || !email.trim()) {
      return res.status(400).json({ success: false, message: "Email address is required." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCompany = company_name.trim();
    const trimmedContact = contact_name.trim();
    const trimmedBusiness = business_type ? business_type.trim() : null;

    // Check if client email already exists
    const [existing] = await pool.query("SELECT id FROM clients WHERE email = ?", [trimmedEmail]);
    if (existing.length > 0) {
      return res.status(409).json({
        success: false,
        message: "A client with this email address already exists.",
      });
    }

    const loginId = await generateUniqueLoginId();
    const plainPassword = password && password.trim() ? password.trim() : generateRandomPassword();
    const passwordHash = await bcrypt.hash(plainPassword, 10);

    // Insert into clients table with source='admin'
    const [insertResult] = await pool.query(
      `INSERT INTO clients (login_id, company_name, business_type, contact_name, email, password_hash, source, signature_status, project_status, is_archived)
       VALUES (?, ?, ?, ?, ?, ?, 'admin', 'Awaiting', 'Not Started', 0)`,
      [loginId, trimmedCompany, trimmedBusiness, trimmedContact, trimmedEmail, passwordHash]
    );

    const clientId = insertResult.insertId;

    // Assign plans to client_plans table if plan_ids provided
    let assignedPlansList = [];
    if (Array.isArray(plan_ids) && plan_ids.length > 0) {
      const [plans] = await pool.query("SELECT id, title, price, currency FROM plans WHERE id IN (?)", [plan_ids]);
      for (const p of plans) {
        await pool.query(
          "INSERT IGNORE INTO client_plans (client_id, plan_id, price_at_assignment) VALUES (?, ?, ?)",
          [clientId, p.id, Number(p.price)]
        );
      }
      assignedPlansList = plans;
    }

    // Log in client_activities
    const planText = assignedPlansList.length > 0
      ? ` with assigned plans: ${assignedPlansList.map((p) => p.title).join(", ")}`
      : "";
    await pool.query(
      "INSERT INTO client_activities (client_id, activity_type, description) VALUES (?, 'Client Created', ?)",
      [clientId, `Client account created directly by Administrator with source=admin${planText}.`]
    );

    return res.status(201).json({
      success: true,
      message: `Client "${trimmedCompany}" created successfully with Login ID ${loginId}.`,
      data: {
        id: clientId,
        login_id: loginId,
        company_name: trimmedCompany,
        contact_name: trimmedContact,
        email: trimmedEmail,
        business_type: trimmedBusiness,
        source: "admin",
        temp_password: plainPassword,
      },
    });
  } catch (error) {
    console.error("Create client error:", error);
    return res.status(500).json({ success: false, message: "Failed to create client account." });
  }
};

// POST /api/admin/clients/:id/direct-link - Get or generate direct passwordless access link
export const generateClientDirectLink = async (req, res) => {
  try {
    const { id } = req.params;
    const [clients] = await pool.query("SELECT id, direct_token, email, company_name FROM clients WHERE id = ?", [id]);
    if (clients.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    let token = clients[0].direct_token;
    if (!token) {
      token = crypto.randomBytes(32).toString("hex");
      await pool.query("UPDATE clients SET direct_token = ? WHERE id = ?", [token, id]);
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const directUrl = `${frontendUrl}/client/profile?token=${token}`;

    return res.json({
      success: true,
      direct_url: directUrl,
      token,
    });
  } catch (error) {
    console.error("Generate client direct link error:", error);
    return res.status(500).json({ success: false, message: "Failed to generate direct access link." });
  }
};

// POST /api/admin/clients/:id/send-direct-email - Send direct passwordless link to client email
export const sendClientDirectEmail = async (req, res) => {
  try {
    const { id } = req.params;
    const [clients] = await pool.query(
      "SELECT id, direct_token, email, contact_name, company_name FROM clients WHERE id = ?",
      [id]
    );
    if (clients.length === 0) {
      return res.status(404).json({ success: false, message: "Client not found." });
    }

    const client = clients[0];
    if (!client.email) {
      return res.status(400).json({ success: false, message: "Client does not have a registered email address." });
    }

    let token = client.direct_token;
    if (!token) {
      token = crypto.randomBytes(32).toString("hex");
      await pool.query("UPDATE clients SET direct_token = ? WHERE id = ?", [token, id]);
    }

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";
    const directUrl = `${frontendUrl}/client/profile?token=${token}`;

    await sendClientDirectLinkEmail({
      toEmail: client.email,
      contactName: client.contact_name,
      companyName: client.company_name,
      directUrl,
    });

    return res.json({
      success: true,
      message: `Direct profile link sent successfully to ${client.email}.`,
      direct_url: directUrl,
    });
  } catch (error) {
    console.error("Send client direct email error:", error);
    return res.status(500).json({ success: false, message: "Failed to send email to client." });
  }
};



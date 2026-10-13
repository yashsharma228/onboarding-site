import pool from "../config/db.js";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const createSignup = async (req, res) => {
  try {
    const { company_name, business_type, contact_name, email } = req.body;

    // Validate presence and types
    if (!company_name || typeof company_name !== "string" || !company_name.trim()) {
      return res.status(400).json({ success: false, message: "Company name is required." });
    }

    if (!business_type || typeof business_type !== "string" || !business_type.trim()) {
      return res.status(400).json({ success: false, message: "Business type is required." });
    }

    if (!contact_name || typeof contact_name !== "string" || !contact_name.trim()) {
      return res.status(400).json({ success: false, message: "Contact name is required." });
    }

    if (!email || typeof email !== "string" || !emailRegex.test(email.trim())) {
      return res.status(400).json({ success: false, message: "A valid email address is required." });
    }

    const trimmedEmail = email.trim().toLowerCase();
    const trimmedCompany = company_name.trim();
    const trimmedBusinessType = business_type.trim();
    const trimmedContact = contact_name.trim();

    // Check if email already exists
    const [existing] = await pool.query(
      "SELECT id, status FROM client_signups WHERE email = ?",
      [trimmedEmail]
    );

    if (existing.length > 0) {
      const currentStatus = existing[0].status;
      if (currentStatus === "Pending") {
        return res.status(409).json({
          success: false,
          message: "An application with this email is already submitted and pending review.",
        });
      }
      if (currentStatus === "Approved") {
        return res.status(409).json({
          success: false,
          message: "This email has already been approved.",
        });
      }
    }

    // Insert new pending signup
    const [result] = await pool.query(
      `INSERT INTO client_signups (company_name, business_type, contact_name, email, status)
       VALUES (?, ?, ?, ?, 'Pending')`,
      [trimmedCompany, trimmedBusinessType, trimmedContact, trimmedEmail]
    );

    return res.status(201).json({
      success: true,
      message: "Application submitted successfully! Your account is pending review.",
      data: {
        id: result.insertId,
        company_name: trimmedCompany,
        business_type: trimmedBusinessType,
        contact_name: trimmedContact,
        email: trimmedEmail,
        status: "Pending",
      },
    });
  } catch (error) {
    console.error("Signup submission error:", error);
    return res.status(500).json({
      success: false,
      message: "An error occurred while processing your registration. Please try again.",
    });
  }
};

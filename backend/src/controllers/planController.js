import pool from "../config/db.js";

// List all plans
export const getPlans = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT id, title, description, currency, price, created_at, updated_at FROM plans ORDER BY id ASC");
    return res.json({
      success: true,
      count: rows.length,
      data: rows,
    });
  } catch (error) {
    console.error("Get plans error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch plans." });
  }
};

// Get single plan
export const getPlanById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query("SELECT id, title, description, currency, price, created_at, updated_at FROM plans WHERE id = ?", [id]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found." });
    }
    return res.json({ success: true, data: rows[0] });
  } catch (error) {
    console.error("Get plan error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch plan." });
  }
};

// Create a new plan with single price and currency dropdown
export const createPlan = async (req, res) => {
  try {
    const { title, description, currency, price } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Plan title is required." });
    }

    const selectedCurrency = currency && ["INR", "GBP", "EUR"].includes(currency.toUpperCase())
      ? currency.toUpperCase()
      : "INR";
    const priceVal = parseFloat(price) >= 0 ? parseFloat(price) : 0;

    const [result] = await pool.query(
      `INSERT INTO plans (title, description, currency, price)
       VALUES (?, ?, ?, ?)`,
      [
        title.trim(),
        description ? description.trim() : "",
        selectedCurrency,
        priceVal,
      ]
    );

    const [created] = await pool.query("SELECT id, title, description, currency, price, created_at, updated_at FROM plans WHERE id = ?", [result.insertId]);

    return res.status(201).json({
      success: true,
      message: `Plan "${title.trim()}" created successfully.`,
      data: created[0],
    });
  } catch (error) {
    console.error("Create plan error:", error);
    return res.status(500).json({ success: false, message: "Failed to create plan." });
  }
};

// Update an existing plan
export const updatePlan = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, currency, price } = req.body;

    const [existing] = await pool.query("SELECT id, currency, price, description FROM plans WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found." });
    }

    if (!title || !title.trim()) {
      return res.status(400).json({ success: false, message: "Plan title is required." });
    }

    const selectedCurrency = currency && ["INR", "GBP", "EUR"].includes(currency.toUpperCase())
      ? currency.toUpperCase()
      : existing[0].currency || "INR";

    const priceVal = parseFloat(price) >= 0 ? parseFloat(price) : existing[0].price;

    await pool.query(
      `UPDATE plans 
       SET title = ?, description = ?, currency = ?, price = ?
       WHERE id = ?`,
      [
        title.trim(),
        description !== undefined ? description.trim() : existing[0].description,
        selectedCurrency,
        priceVal,
        id,
      ]
    );

    const [updated] = await pool.query("SELECT id, title, description, currency, price, created_at, updated_at FROM plans WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: `Plan "${title.trim()}" updated successfully.`,
      data: updated[0],
    });
  } catch (error) {
    console.error("Update plan error:", error);
    return res.status(500).json({ success: false, message: "Failed to update plan." });
  }
};

// Delete a plan
export const deletePlan = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await pool.query("SELECT id, title FROM plans WHERE id = ?", [id]);
    if (existing.length === 0) {
      return res.status(404).json({ success: false, message: "Plan not found." });
    }

    const planTitle = existing[0].title;
    await pool.query("DELETE FROM client_plans WHERE plan_id = ?", [id]);
    await pool.query("DELETE FROM plans WHERE id = ?", [id]);

    return res.json({
      success: true,
      message: `Plan "${planTitle}" has been permanently deleted.`,
    });
  } catch (error) {
    console.error("Delete plan error:", error);
    return res.status(500).json({ success: false, message: error.message || "Failed to delete plan." });
  }
};

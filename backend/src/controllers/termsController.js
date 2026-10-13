import pool from "../config/db.js";

// Get terms and conditions
export const getTerms = async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM terms_and_conditions ORDER BY id DESC LIMIT 1");
    if (rows.length === 0) {
      return res.json({
        success: true,
        data: {
          id: null,
          title: "Terms and Conditions",
          content: "<p>No terms and conditions configured yet.</p>",
          updated_at: null,
        },
      });
    }

    return res.json({
      success: true,
      data: rows[0],
    });
  } catch (error) {
    console.error("Get terms error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch terms and conditions." });
  }
};

// Update terms and conditions
export const updateTerms = async (req, res) => {
  try {
    const { title, content } = req.body;

    if (content === undefined || content === null) {
      return res.status(400).json({ success: false, message: "Terms content is required." });
    }

    const termTitle = title && title.trim() ? title.trim() : "Terms and Conditions";

    const [existing] = await pool.query("SELECT id FROM terms_and_conditions ORDER BY id DESC LIMIT 1");

    let recordId;
    if (existing.length > 0) {
      recordId = existing[0].id;
      await pool.query(
        "UPDATE terms_and_conditions SET title = ?, content = ? WHERE id = ?",
        [termTitle, content, recordId]
      );
    } else {
      const [insertResult] = await pool.query(
        "INSERT INTO terms_and_conditions (title, content) VALUES (?, ?)",
        [termTitle, content]
      );
      recordId = insertResult.insertId;
    }

    const [updated] = await pool.query("SELECT * FROM terms_and_conditions WHERE id = ?", [recordId]);

    return res.json({
      success: true,
      message: "Terms and conditions saved successfully.",
      data: updated[0],
    });
  } catch (error) {
    console.error("Update terms error:", error);
    return res.status(500).json({ success: false, message: "Failed to save terms and conditions." });
  }
};

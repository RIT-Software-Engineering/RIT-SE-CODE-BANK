const express = require('express');
const router = express.Router();
const pool = require('../db');

// Save Draft
router.post("/draft", async (req, res) => {
  const { faculty_information_id, draft_data } = req.body;

  if (!faculty_information_id) {
    return res.status(400).json({ error: "faculty_information_id required" });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    //delete old draft
    await conn.query(`DELETE FROM highlight_drafts WHERE faculty_information_id = ?`, [
      faculty_information_id
    ]);
    //save new draft
    const result = await conn.query(
      `INSERT INTO highlight_drafts (faculty_information_id, draft_json)
       VALUES (?, ?)`,
      [faculty_information_id, JSON.stringify(draft_data)]
    );

    return res.status(201).json({ message: "Draft saved" });

  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to save draft" });
  } finally {
    if (conn) conn.end();
  }
});

// Load Draft
router.get("/draft/:facultyId", async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      `SELECT draft_json FROM highlight_drafts WHERE faculty_information_id = ?`,
      [req.params.facultyId]
    );

    if (rows.length === 0) return res.json(null);

    return res.json(JSON.parse(rows[0].draft_json));
  } catch (err) {
    console.log(err);
    return res.status(500).json({ error: "Failed to load draft" });
  } finally {
    if (conn) conn.end();
  }
});

module.exports = router;
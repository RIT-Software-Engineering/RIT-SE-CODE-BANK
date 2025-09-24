
const express = require('express');
const router = express.Router();
const pool = require('../api/service_api');


router.get('/:status', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT * FROM grants WHERE grant_status = ?",
      [req.params.status]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fecthing grants by status" });
  } finally {
    if (conn) conn.release();
  }
});


router.post('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const { title, funder, amount, time_period, faculty_role, faculty_share, comments, grant_status } = req.body;
    const result = await conn.query(
      `INSERT INTO grants (form_id, title, funder, amount, time_period, faculty_role, faculty_share, comments, grant_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, funder, amount, time_period, faculty_role, faculty_share, comments, grant_status]
    );
    res.json({ grant_id: result.insertId, message: "Grant added successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "=error adding grant" });
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;

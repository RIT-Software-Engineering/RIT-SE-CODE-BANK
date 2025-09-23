const express = require('express');
const router = express.Router();

const pool = require('../db');

router.get('/test', (req, res) => {
  res.send("Faculty route is wired up!");
});


// Route: read all faculty info
router.get('/', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM faculty_information");
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error reading faculty information");
  } finally {
    if (conn) conn.release(); // release back to pool
  }
});

// Route: read single faculty by ID
router.get('/:id', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      "SELECT * FROM faculty_information WHERE faculty_id = ?",
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).send("Faculty not found");
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).send("Error reading faculty information");
  } finally {
    if (conn) conn.release();
  }
});

module.exports = router;

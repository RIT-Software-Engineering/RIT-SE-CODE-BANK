const express = require('express');
const app = express();

require('dotenv').config();
const mariadb = require('mariadb');

// Create a pool instead of a one-off connection
const pool = mariadb.createPool({
  host: 'localhost',
  user: 'codebase-rit',
  password: 'password',
  database: 'rit_codebase',
  connectionLimit: 5
});

// Test route (just to confirm server is alive)
app.get('/', (req, res) => {
  res.send('Server is running...');
});

// Route: read all faculty info
app.get('/faculty', async (req, res) => {
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
app.get('/faculty/:id', async (req, res) => {
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

// Start Express server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});

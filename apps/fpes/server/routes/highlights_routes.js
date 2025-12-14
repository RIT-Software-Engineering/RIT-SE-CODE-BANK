const express = require('express');
const router = express.Router();
const pool = require('../db'); 
const { submitHighlightsForm, getHighlightByFacultyId } = require('../api/highlights_api');

// GET all
router.get('/', async (_req, res) => {
  let conn;
  try {
    conn = await pool.getConnection(); //necessary to call db instead of api functions?
    const rows = await conn.query('SELECT * FROM highlights');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch highlights' });
  } finally {
    if (conn) conn.end(); //release
  }
});

// GET by facultyID
router.get("/submitted_by/:facultyID", async(req, res) => {
  try{
    const results = await getHighlightByFacultyId(req.params.facultyID);
    return res.send(results);
  } catch (err){
    console.error(err)
    return res.status(500).json({ error : "Failed to get highlights forms"})
  }
});

// GET by id
router.get('/:id', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM highlights WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch highlight' });
  } finally {
    if (conn) conn.end();
  }
});

// CREATE
router.post('/', async (req, res) => {
  const {
    faculty_information_id,
    supervisor_id = null,
    student_support_id = null,
    collaborations_section = null,
    professional_development = null,
    significant_outcomes = null
  } = req.body;

  if (!faculty_information_id) {
    return res.status(400).json({ error: 'faculty_information_id is required' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      `INSERT INTO highlights
       (faculty_information_id, supervisor_id, student_support_id, collaborations_section, professional_development, significant_outcomes)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      [faculty_information_id, supervisor_id, student_support_id, collaborations_section, professional_development, significant_outcomes]
    );
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create highlight' });
  } finally {
    if (conn) conn.end();
  }
});

// UPDATE (PUT = replace fields you send)
router.put('/:id', async (req, res) => {
  const {
    faculty_information_id,
    supervisor_id = null,
    student_support_id = null,
    collaborations_section = null,
    professional_development = null
  } = req.body;

  if (!faculty_information_id) { //Requires faculty info id for full replacement of table
    return res.status(400).json({ error: 'faculty_information_id is required' });
  }

  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      `UPDATE highlights
       SET faculty_information_id=?, supervisor_id=?, student_support_id=?,
           collaborations_section=?, professional_development=?
       WHERE id=?`,
      [faculty_information_id, supervisor_id, student_support_id, collaborations_section, professional_development, req.params.id]
    );
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update highlight' });
  } finally {
    if (conn) conn.end();
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query('DELETE FROM highlights WHERE id = ?', [req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send(); // no content
  } catch (err) {
    console.error(err);
    // likely FK constraint error -> surface a 409
    if (err && err.code === 'ER_ROW_IS_REFERENCED_2') {
      return res.status(409).json({ error: 'Cannot delete: referenced by other records' });
    }
    res.status(500).json({ error: 'Failed to delete highlight' });
  } finally {
    if (conn) conn.end();
  }
});

// FULL FORM SUBMISSION
/*
  This is the endpoint where all the data to completely fill the form is sent. It not only includes the data
  to complete the highlights record but also the other dynamic form pieces such as the services and publications
*/
router.post("/submit", async(req, res) => {
  try {
    const data = req.body;
    data.status = "SUBMITTED";  
    const results = await submitHighlightsForm(data);
    return res.send(results);
  } catch (err){
    return res.status(500).json({ error : "Failed to submit form"});
  }
});

router.post("/draft", async (req, res) => {
  try {
    const data = req.body;
    data.status = "DRAFT";
    const result = await submitHighlightsForm(data);
    return res.send({ success: true, id: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save draft" });
  }
});

module.exports = router;

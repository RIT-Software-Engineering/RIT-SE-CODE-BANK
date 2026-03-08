const express = require('express');
const router = express.Router();
const pool = require('../db');
const { saveParsedTeachingEval } = require('../api/teaching_eval_api');

router.get('/submitted_by/:facultyId', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(
      `SELECT te.id, f.time_submitted, te.course_name, te.professor_name, te.semester, te.year, f.id as form_id
       FROM teaching_evals te
       JOIN forms f ON te.form_id = f.id
       WHERE f.faculty_information_id = ?`,
      [req.params.facultyId]
    );
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teaching evals' });
  }
});

router.get('/:formId/view', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const evalData = await conn.query(
      `SELECT te.*, f.time_submitted
       FROM teaching_evals te
       JOIN forms f ON te.form_id = f.id
       WHERE f.id = ?`,
      [req.params.formId]
    );
    
    if (!evalData || evalData.length === 0) {
      conn.release();
      return res.status(404).json({ error: 'Teaching eval not found' });
    }
    
    const questions = await conn.query(
      'SELECT * FROM teaching_eval_questions WHERE teaching_eval_id = ? ORDER BY CAST(question_number AS UNSIGNED)',
      [evalData[0].id]
    );
    
    conn.release();
    res.json({ ...evalData[0], questions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teaching eval' });
  }
});

router.post("/parsed", async (req, res) => {
  try {
    const { faculty_id } = req.body;
    if (!faculty_id) {
      return res.status(400).json({ error: 'faculty_id is required' });
    }
    const result = await saveParsedTeachingEval(req.body);
    res.json({ 
      success: true, 
      evalId: result.evalId, 
      formId: result.formId
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to save teaching eval" });
  }
});

module.exports = router;

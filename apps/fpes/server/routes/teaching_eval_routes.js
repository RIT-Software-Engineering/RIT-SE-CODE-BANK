const express = require('express');
const router = express.Router();
const pool = require('../db');
const { saveParsedTeachingEval, getFacultyTeachingEvalPercentiles, getFacultyPercentileById, summarizeTeachingEval } = require('../api/teaching_eval_api');

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
      `SELECT te.*, f.time_submitted, f.faculty_information_id
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
    
    // Fetch text responses grouped by question
    const textResponses = await conn.query(
      `SELECT q.id, q.question, r.response
       FROM teaching_eval_text_questions q
       LEFT JOIN teaching_eval_text_responses r ON q.id = r.question_id
       WHERE r.teaching_eval_id = ?
       ORDER BY q.id`,
      [evalData[0].id]
    );
    
    // Group text responses by question
    const text_responses = [];
    const questionMap = {};
    
    for (const row of textResponses) {
      if (!questionMap[row.id]) {
        questionMap[row.id] = {
          question: row.question,
          responses: []
        };
        text_responses.push(questionMap[row.id]);
      }
      if (row.response) {
        questionMap[row.id].responses.push(row.response);
      }
    }
    
    conn.release();
    res.json({ ...evalData[0], questions, text_responses });
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

router.get('/percentiles', async (req, res) => {
  try {
    const result = await getFacultyTeachingEvalPercentiles();
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch percentiles' });
  }
});

router.get('/all', async (req, res) => {
  try {
    const conn = await pool.getConnection();
    const rows = await conn.query(
      `SELECT te.*, f.time_submitted
       FROM teaching_evals te
       JOIN forms f ON te.form_id = f.id
       ORDER BY f.time_submitted DESC`
    );
    conn.release();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teaching evals' });
  }
});

router.get('/percentile/faculty/:facultyId', async (req, res) => {
  try {
    const result = await getFacultyPercentileById(req.params.facultyId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch percentile' });
  }
});

router.post('/:formId/summarize', async (req, res) => {
  try {
    const summary = await summarizeTeachingEval(req.params.formId);
    res.json({ summary });
  } catch (err) {
    console.error(err);
    const message = err.message || 'Failed to generate summary';
    res.status(500).json({ error: message });
  }
});

module.exports = router;

const express = require('express');
const router = express.Router();
const pool = require('../db');
const { submitHighlightsForm, getHighlightByFacultyId } = require('../api/highlights_api');
const { saveParsedHighlights, updateParsedHighlights } = require('../api/parsed_highlights_api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
}

async function withConn(fn) {
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

// GET all highlights for admin (with faculty name and form info)
router.get('/all', async (_req, res) => {
  try {
    const rows = await withConn(conn => conn.query(`
      SELECT f.id as form_id, fi.name as faculty_name, f.time_submitted
      FROM forms f
      JOIN highlights h ON f.id = h.form_id
      JOIN faculty_information fi ON f.faculty_information_id = fi.faculty_id
      ORDER BY f.time_submitted DESC
    `));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch all highlights' });
  }
});

// POST summarize a highlights form using AI
router.post('/:formId/summarize', async (req, res) => {
  try {
    const { formId } = req.params;
    const [formRows, publications, grants] = await withConn(async conn => Promise.all([
      conn.query(
        `SELECT fi.name, fi.rank, h.teaching_section, h.service_section,
                h.administrative_responsibilities, h.professional_development,
                h.significant_outcomes, h.curriculum_development
         FROM forms f
         JOIN highlights h ON f.id = h.form_id
         JOIN faculty_information fi ON f.faculty_information_id = fi.faculty_id
         WHERE f.id = ?`,
        [formId]
      ),
      conn.query(
        `SELECT p.title FROM publications p
         JOIN forms_publications fp ON p.id = fp.publication_id WHERE fp.form_id = ?`,
        [formId]
      ),
      conn.query(
        `SELECT g.title FROM grants g
         JOIN forms_grants fg ON g.grant_id = fg.grant_id WHERE fg.form_id = ?`,
        [formId]
      ),
    ]));

    if (!formRows[0]) return res.status(404).json({ error: 'Form not found' });
    const h = formRows[0];

    const prompt = `You are summarizing a faculty highlights form for an academic review system.

Faculty: ${h.name}, ${h.rank || 'Faculty'}

Teaching: ${h.teaching_section || h.curriculum_development || 'None listed'}

Scholarship:
- Publications (${publications.length}): ${publications.map(p => p.title).join('; ') || 'None'}
- Grants (${grants.length}): ${grants.map(g => g.title).join('; ') || 'None'}
- Significant outcomes: ${h.significant_outcomes || 'None listed'}

Service: ${h.service_section || 'None listed'}

Administrative: ${h.administrative_responsibilities || 'None listed'}

Professional Development: ${h.professional_development || 'None listed'}

Write a concise 3-4 sentence summary covering teaching, scholarship, and service. Be factual and professional.`;

    const result = await getModel().generateContent(prompt);
    res.json({ summary: result.response.text() });
  } catch (err) {
    if (err.status === 429) return res.status(429).json({ error: 'AI quota exceeded. Please try again later.' });
    console.error(err);
    res.status(500).json({ error: 'Failed to generate summary' });
  }
});

// GET all
router.get('/', async (_req, res) => {
  try {
    const rows = await withConn(conn => conn.query('SELECT * FROM highlights'));
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch highlights' });
  }
});

// GET by facultyID
router.get('/submitted_by/:facultyID', async (req, res) => {
  try {
    const results = await getHighlightByFacultyId(req.params.facultyID);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get highlights forms' });
  }
});

router.post('/parsed', async (req, res) => {
  try {
    const { faculty_id } = req.body;
    if (!faculty_id) return res.status(400).json({ error: 'faculty_id is required' });
    const result = await saveParsedHighlights(req.body);
    res.json({ success: true, id: result.id, formId: result.formId, replaced: result.replaced });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save parsed data' });
  }
});

router.put('/parsed/:formId', async (req, res) => {
  try {
    const result = await updateParsedHighlights(req.params.formId, req.body);
    res.json({ success: true, formId: result.formId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update parsed data' });
  }
});

// GET by id
router.get('/:id', async (req, res) => {
  try {
    const rows = await withConn(conn => conn.query('SELECT * FROM highlights WHERE id = ?', [req.params.id]));
    if (rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch highlight' });
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

  if (!faculty_information_id) return res.status(400).json({ error: 'faculty_information_id is required' });

  try {
    const result = await withConn(conn => conn.query(
      `INSERT INTO highlights
       (faculty_information_id, supervisor_id, student_support_id, collaborations_section, professional_development, significant_outcomes)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      [faculty_information_id, supervisor_id, student_support_id, collaborations_section, professional_development, significant_outcomes]
    ));
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create highlight' });
  }
});

// UPDATE
router.put('/:id', async (req, res) => {
  const {
    faculty_information_id,
    supervisor_id = null,
    student_support_id = null,
    collaborations_section = null,
    professional_development = null
  } = req.body;

  if (!faculty_information_id) return res.status(400).json({ error: 'faculty_information_id is required' });

  try {
    const result = await withConn(conn => conn.query(
      `UPDATE highlights
       SET faculty_information_id=?, supervisor_id=?, student_support_id=?,
           collaborations_section=?, professional_development=?
       WHERE id=?`,
      [faculty_information_id, supervisor_id, student_support_id, collaborations_section, professional_development, req.params.id]
    ));
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.json({ ok: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update highlight' });
  }
});

// DELETE
router.delete('/:id', async (req, res) => {
  try {
    const result = await withConn(conn => conn.query('DELETE FROM highlights WHERE id = ?', [req.params.id]));
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Not found' });
    res.status(204).send();
  } catch (err) {
    console.error(err);
    if (err.code === 'ER_ROW_IS_REFERENCED_2') return res.status(409).json({ error: 'Cannot delete: referenced by other records' });
    res.status(500).json({ error: 'Failed to delete highlight' });
  }
});

// FULL FORM SUBMISSION
router.post('/submit', async (req, res) => {
  try {
    const data = { ...req.body, status: 'SUBMITTED' };
    const results = await submitHighlightsForm(data);
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

router.post('/draft', async (req, res) => {
  try {
    const data = { ...req.body, status: 'DRAFT' };
    const result = await submitHighlightsForm(data);
    res.json({ success: true, id: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save draft' });
  }
});

module.exports = router;

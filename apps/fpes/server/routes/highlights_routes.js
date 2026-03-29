const express = require('express');
const router = express.Router();
const pool = require('../db');
const { submitHighlightsForm, getHighlightByFacultyId } = require('../api/highlights_api');
const { saveParsedHighlights, updateParsedHighlights } = require('../api/parsed_highlights_api');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const model = new GoogleGenerativeAI(process.env.GEMINI_KEY)
  .getGenerativeModel({ model: 'gemini-2.0-flash' });

async function withConn(fn) {
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

// GET all highlights for admin
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

    const [formRows, publications, grants, serviceRows] = await withConn(conn => Promise.all([
      conn.query(
        `SELECT fi.name, fi.rank, h.teaching_section, h.service_section,
                h.administrative_responsibilities, h.professional_development,
                h.significant_outcomes, h.curriculum_development, h.service_hours
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
      conn.query(
        `SELECT COALESCE(SUM(s.hours_worked), 0) as total
         FROM services s
         JOIN forms_services fs ON s.id = fs.service_id
         WHERE fs.form_id = ?`,
        [formId]
      ),
    ]));

    if (!formRows[0]) return res.status(404).json({ error: 'Form not found' });
    const h = formRows[0];

    const summedHours = Number(serviceRows[0]?.total ?? 0);
    const hoursFromText = (() => {
      const matches = [...(h.service_section || '').matchAll(/(\d+)\s*(?:hrs?\.?|hours?)/gi)];
      return matches.reduce((sum, m) => sum + parseInt(m[1]), 0);
    })();
    const totalServiceHours = summedHours || Number(h.service_hours) || hoursFromText || null;

    // Fetch student_mentoring separately — column may not exist on all environments
    let studentMentoring = null;
    try {
      const smRows = await withConn(conn => conn.query(
        'SELECT student_mentoring FROM highlights WHERE form_id = ?', [formId]
      ));
      studentMentoring = smRows[0]?.student_mentoring || null;
    } catch (_) { /* fall back to teaching_section */ }

    const mentoringText = studentMentoring || h.teaching_section || 'None listed';

    const prompt = `You are evaluating a faculty highlights form for an academic review system.

Faculty: ${h.name}, ${h.rank || 'Faculty'}

Teaching: ${h.teaching_section || h.curriculum_development || 'None listed'}
Student Mentoring:
${mentoringText}

Scholarship:
- Publications (${publications.length}): ${publications.map(p => p.title).join('; ') || 'None'}
- Grants (${grants.length}): ${grants.map(g => g.title).join('; ') || 'None'}
- Significant outcomes: ${h.significant_outcomes || 'None listed'}

Service: ${h.service_section || 'None listed'}
Total service hours: ${totalServiceHours ?? 'Not recorded'}

Administrative: ${h.administrative_responsibilities || 'None listed'}

Professional Development: ${h.professional_development || 'None listed'}

Return ONLY a valid JSON object (no markdown, no code fences) with this exact structure:
{"teaching":{"rating":3,"comments":"..."},"scholarship":{"rating":3,"disseminated":"Y","comments":"..."},"service":{"rating":3,"comments":"..."},"administrative":{"rating":3,"comments":"..."},"overall":{"rating":3,"comments":"..."}}
For each section write a detailed 6-8 sentence evaluation that references specific contributions by name (courses, grants, publications, service roles, committees), highlights notable achievements with context, draws comparisons where relevant, and notes any areas for growth. The overall section should be 8-10 sentences synthesizing performance across all areas with specific examples from each category. Always refer to the faculty by their actual name (${h.name}). Do not use vague or generic language — every sentence must reference something specific from the data provided. Be factual, thorough, and professional.`;

    const result = await model.generateContent(prompt);
    const text = result.response.text().trim().replace(/^```json\s*|^```\s*|\s*```$/g, '');
    let summary;
    try {
      summary = JSON.parse(text);
    } catch {
      summary = { overall: { rating: null, comments: text } };
    }
    res.json({ summary });
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

// POST save parsed highlights
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

// PUT update parsed highlights
router.put('/parsed/:formId', async (req, res) => {
  try {
    const result = await updateParsedHighlights(req.params.formId, req.body);
    res.json({ success: true, formId: result.formId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update parsed data' });
  }
});

// POST full form submission
router.post('/submit', async (req, res) => {
  try {
    const results = await submitHighlightsForm({ ...req.body, status: 'SUBMITTED' });
    res.json(results);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit form' });
  }
});

// POST save draft
router.post('/draft', async (req, res) => {
  try {
    const result = await submitHighlightsForm({ ...req.body, status: 'DRAFT' });
    res.json({ success: true, id: result.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save draft' });
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

module.exports = router;

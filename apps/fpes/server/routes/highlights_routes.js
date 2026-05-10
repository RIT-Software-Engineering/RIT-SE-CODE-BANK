const express = require('express');
const router = express.Router();
const pool = require('../db');
const { submitHighlightsForm, getHighlightByFacultyId } = require('../api/highlights_api');
const { saveParsedHighlights, updateParsedHighlights } = require('../api/parsed_highlights_api');
const { calculateTeachingScore, summarizeTeachingEval } = require('../api/teaching_eval_api');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const key = process.env.GEMINI_KEY;
if (!key) console.error('[highlights_routes] WARNING: GEMINI_KEY is not set');
const modelName = 'gemini-2.5-flash-lite';
function getGenAIModel() {
  return new GoogleGenerativeAI(key).getGenerativeModel({ model: modelName });
}

const summaryCache = new Map(); // formId -> { summary, expiresAt }
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Persists a generated summary to the form_summaries table.
 * Uses ON DUPLICATE KEY UPDATE so regeneration overwrites the existing row.
 * @param {object} conn - Active DB connection
 * @param {{ formId?: number, facultyId?: string, type: 'form'|'annual', summary: object }} opts
 */
async function saveSummaryToDB(conn, { formId, facultyId, type, summary }) {
  const json = JSON.stringify(summary);
  if (type === 'form') {
    await conn.query(
      `INSERT INTO form_summaries (form_id, summary_type, summary_json) VALUES (?, 'form', ?)
       ON DUPLICATE KEY UPDATE summary_json = VALUES(summary_json), updated_at = CURRENT_TIMESTAMP`,
      [formId, json]
    );
  } else if (type === 'teaching_eval') {
    await conn.query(
      `INSERT INTO form_summaries (form_id, summary_type, summary_json) VALUES (?, 'teaching_eval', ?)
       ON DUPLICATE KEY UPDATE summary_json = VALUES(summary_json), updated_at = CURRENT_TIMESTAMP`,
      [formId, json]
    );
  } else {
    await conn.query(
      `INSERT INTO form_summaries (faculty_id, summary_type, summary_json) VALUES (?, 'annual', ?)
       ON DUPLICATE KEY UPDATE summary_json = VALUES(summary_json), updated_at = CURRENT_TIMESTAMP`,
      [facultyId, json]
    );
  }
}

/**
 * Loads a stored summary from the form_summaries table.
 * @param {object} conn - Active DB connection
 * @param {{ formId?: number, facultyId?: string, type: 'form'|'annual' }} opts
 * @returns {object|null} Parsed summary JSON, or null if not found
 */
async function loadSummaryFromDB(conn, { formId, facultyId, type }) {
  const rows = type === 'form'
    ? await conn.query(`SELECT summary_json FROM form_summaries WHERE form_id = ? AND summary_type = 'form'`, [formId])
    : type === 'annual'
    ? await conn.query(`SELECT summary_json FROM form_summaries WHERE faculty_id = ? AND summary_type = 'annual'`, [facultyId])
    : await conn.query(`SELECT summary_json FROM form_summaries WHERE form_id = ? AND summary_type = 'teaching_eval'`, [formId]);
  if (!rows[0]) return null;
  try { return JSON.parse(rows[0].summary_json); } catch { return null; }
}

async function withConn(fn) {
  const conn = await pool.getConnection();
  try {
    return await fn(conn);
  } finally {
    conn.release();
  }
}

// Returns a cached teaching eval summary from DB, or generates+saves one if not stored.
// Pass refresh=true to force regeneration.
async function getTeachingEvalSummary(formId, refresh = false) {
  if (!refresh) {
    const stored = await withConn(conn => loadSummaryFromDB(conn, { formId, type: 'teaching_eval' }));
    if (stored) return stored;
  }
  const text = await summarizeTeachingEval(formId);
  await withConn(conn => saveSummaryToDB(conn, { formId, type: 'teaching_eval', summary: text }));
  return text;
}

// GET all highlights for admin
router.get('/all', async (_req, res) => {
  try {
    const rows = await withConn(conn => conn.query(`
      SELECT f.id as form_id, fi.name as faculty_name, fi.faculty_id, h.teaching_section, f.time_submitted
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

// GET stored annual evaluation for a faculty member
router.get('/annual-eval/:facultyId', async (req, res) => {
  try {
    const stored = await withConn(conn => loadSummaryFromDB(conn, { facultyId: req.params.facultyId, type: 'annual' }));
    if (!stored) return res.status(404).json({ error: 'No stored annual evaluation found.' });
    res.json({ summary: stored, cached: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch annual evaluation' });
  }
});

// PUT save an edited annual evaluation (no AI call)
router.put('/annual-eval/:facultyId', async (req, res) => {
  try {
    const { summary } = req.body;
    if (!summary) return res.status(400).json({ error: 'summary is required' });
    await withConn(conn => saveSummaryToDB(conn, { facultyId: req.params.facultyId, type: 'annual', summary }));
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save annual evaluation' });
  }
});

// DELETE remove stored annual evaluation
router.delete('/annual-eval/:facultyId', async (req, res) => {
  try {
    await withConn(conn => conn.query(
      'DELETE FROM form_summaries WHERE faculty_id = ? AND summary_type = ?',
      [req.params.facultyId, 'annual']
    ));
    res.json({ success: true, message: 'Annual evaluation deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete annual evaluation' });
  }
});

// POST generate annual evaluation — skips AI if a stored summary already exists
router.post('/annual-eval/:facultyId', async (req, res) => {
  try {
    if (req.query.refresh !== 'true') {
      const stored = await withConn(conn => loadSummaryFromDB(conn, { facultyId: req.params.facultyId, type: 'annual' }));
      if (stored) return res.json({ summary: stored, cached: true });
    }

    const { facultyId } = req.params;
    const yearFilter = '';

    // Aggregate all highlights data for this faculty
    const [highlights, publications, grants, serviceRows, facultyInfo] = await withConn(conn => Promise.all([
      conn.query(
        `SELECT h.teaching_section, h.service_section, h.administrative_responsibilities,
                h.professional_development, h.significant_outcomes, h.curriculum_development,
                h.service_hours, h.student_mentoring, f.time_submitted
         FROM highlights h JOIN forms f ON h.form_id = f.id
         WHERE f.faculty_information_id = ? ${yearFilter}
         ORDER BY f.time_submitted DESC`,
        [facultyId]
      ),
      conn.query(
        `SELECT DISTINCT p.title FROM publications p
         JOIN forms_publications fp ON p.id = fp.publication_id
         JOIN forms f ON fp.form_id = f.id
         WHERE f.faculty_information_id = ? ${yearFilter}`,
        [facultyId]
      ),
      conn.query(
        `SELECT DISTINCT g.title FROM grants g
         JOIN forms_grants fg ON g.grant_id = fg.grant_id
         JOIN forms f ON fg.form_id = f.id
         WHERE f.faculty_information_id = ? ${yearFilter}`,
        [facultyId]
      ),
      conn.query(
        `SELECT COALESCE(SUM(s.hours_worked), 0) as total
         FROM services s
         JOIN forms_services fs ON s.id = fs.service_id
         JOIN forms f ON fs.form_id = f.id
         WHERE f.faculty_information_id = ? ${yearFilter}`,
        [facultyId]
      ),
      conn.query(
        'SELECT name, rank FROM faculty_information WHERE faculty_id = ?',
        [facultyId]
      ),
    ]));

    if (!facultyInfo[0]) return res.status(404).json({ error: 'Faculty not found' });
    if (!highlights.length) return res.status(404).json({ error: 'No submissions found for this faculty.' });

    const { name, rank } = facultyInfo[0];

    // Build scrub function
    const nameParts = name ? name.trim().split(/\s+/).filter(p => p.length > 1) : [];
    const lastName = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : null;
    const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegexes = [
      name ? new RegExp(escape(name), 'gi') : null,
      ...nameParts.map(p => new RegExp(escape(p), 'gi')),
      lastName ? new RegExp(`(?:Prof\.?|Professor)\\s+${escape(lastName)}`, 'gi') : null,
    ].filter(Boolean);
    const scrub = (text) => {
      if (!text) return text;
      let result = String(text);
      for (const re of nameRegexes) result = result.replace(re, 'the faculty member');
      return result;
    };

    // Aggregate text fields across all forms
    const combine = (field) => highlights.map(h => h[field]).filter(Boolean).join('\n');
    const totalServiceHours = Number(serviceRows[0]?.total ?? 0);

    // Fetch teaching eval summary from most recent eval only
    let teachingEvalText = 'No teaching evaluations available.';
    try {
      const evalForms = await withConn(conn => conn.query(
        `SELECT f.id FROM forms f JOIN teaching_evals te ON te.form_id = f.id
         WHERE f.faculty_information_id = ? ${yearFilter}
         ORDER BY f.time_submitted DESC LIMIT 1`,
        [facultyId]
      ));
      if (evalForms.length) {
        const refresh = req.query.refresh === 'true';
        teachingEvalText = await getTeachingEvalSummary(evalForms[0].id, refresh).catch(() => 'No teaching evaluation data available.');
      }
    } catch (_) {}

    const teachingScore = await calculateTeachingScore(facultyId, combine('teaching_section'));
    const evalScore = teachingScore?.score ?? 3;
    const improvementScore = (teachingScore?.matchedKeywords?.length ?? 0) >= 2 ? 1 : 0;
    const finalTeachingRating = Math.min(5, evalScore + improvementScore);

    const prompt = `You are writing an annual faculty evaluation. Return ONLY valid JSON, no markdown.
      Structure: {"teaching":{"rating":${finalTeachingRating},"comments":""},"scholarship":{"rating":1-5,"disseminated":"Y/N","comments":""},"service":{"rating":1-5,"comments":""},"administrative":{"rating":1-5,"comments":""},"overall":{"rating":3-5,"comments":""}}
      IMPORTANT: Do NOT use any person's name. Refer to the faculty member only as "the faculty member" or "they".
      For teaching comments, write ONLY one paragraph summarizing course improvement activities from the highlights teaching section. Do NOT repeat or rewrite the teaching eval summary — it will be prepended separately.
      Write 3-5 sentences for all other sections. Overall rating must be 3, 4, or 5.
      This covers ALL submissions by this faculty member.

      Faculty rank: ${rank || 'Faculty'}
      Highlights teaching section (paragraph 2 only): ${scrub(combine('teaching_section') || combine('curriculum_development') || 'None')}
      Mentoring: ${scrub(combine('student_mentoring') || combine('teaching_section') || 'None')}
      Publications (${publications.length}): ${publications.map(p => p.title).join('; ') || 'None'}
      Grants (${grants.length}): ${grants.map(g => g.title).join('; ') || 'None'}
      Significant outcomes: ${scrub(combine('significant_outcomes') || 'None')}
      Service: ${scrub(combine('service_section') || 'None')} | Total hours: ${totalServiceHours || 'N/A'}
      Administrative: ${scrub(combine('administrative_responsibilities') || 'None')}
      Professional Development: ${scrub(combine('professional_development') || 'None')}`;

    const result = await getGenAIModel().generateContent(prompt);
    const rawText = scrub(result.response.text().trim().replace(/^```json\s*|^```\s*|\s*```$/g, ''));
    let summary;
    try { summary = JSON.parse(rawText); }
    catch { summary = { overall: { rating: null, comments: rawText } }; }

    const scrubObj = (obj) => {
      if (typeof obj === 'string') return scrub(obj);
      if (typeof obj === 'object' && obj !== null)
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, scrubObj(v)]));
      return obj;
    };
    summary = scrubObj(summary);
    if (summary.teaching) {
      summary.teaching.rating = finalTeachingRating;
      const p1 = teachingEvalText !== 'No teaching evaluations available.' ? teachingEvalText : 'No teaching evaluation data available.';
      const p2 = summary.teaching.comments || '';
      summary.teaching.comments = p2 ? `${p1}\n\n${p2}` : p1;
    }
    if (summary.overall?.rating != null) summary.overall.rating = Math.max(3, summary.overall.rating);

    await withConn(conn => saveSummaryToDB(conn, { facultyId, type: 'annual', summary }));
    res.json({ summary, meta: { forms: highlights.length, publications: publications.length, grants: grants.length } });
  } catch (err) {
    if (err.status === 429 || String(err?.message).includes('429')) return res.status(429).json({ error: 'AI quota exceeded. Please try again later.' });
    console.error(err);
    res.status(500).json({ error: 'Failed to generate annual evaluation' });
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

    const facultyId = formRows[0] ? await withConn(conn => conn.query(
      'SELECT faculty_information_id FROM forms WHERE id = ?', [formId]
    )).then(r => r[0]?.faculty_information_id) : null;
    const teachingScore = facultyId ? await calculateTeachingScore(facultyId, h.teaching_section || '') : null;

    // Fetch the most recent teaching eval form for this faculty to generate paragraph 1
    let teachingEvalSummary = null;
    if (facultyId) {
      try {
        const evalForms = await withConn(conn => conn.query(
          `SELECT f.id FROM forms f
           JOIN teaching_evals te ON te.form_id = f.id
           WHERE f.faculty_information_id = ?
           ORDER BY f.time_submitted DESC LIMIT 1`,
          [facultyId]
        ));
        if (evalForms[0]) teachingEvalSummary = await getTeachingEvalSummary(evalForms[0].id, req.query.refresh === 'true');
      } catch (_) { /* no eval available */ }
    }

    // Teaching rating = eval score (3 or 4) + highlights improvement score (0 or 1)
    const evalScore = teachingScore?.score ?? 3; // 3 or 4 from percentile
    const improvementScore = (teachingScore?.matchedKeywords?.length ?? 0) >= 2 ? 1 : 0; // 0 or 1
    const finalTeachingRating = Math.min(5, evalScore + improvementScore);

    // Build regex patterns to strip name from AI input and output
    const nameParts = h.name ? h.name.trim().split(/\s+/).filter(p => p.length > 1) : [];
    const lastName = nameParts.length >= 2 ? nameParts[nameParts.length - 1] : null;
    const escape = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const nameRegexes = [
      h.name ? new RegExp(escape(h.name), 'gi') : null,
      ...nameParts.map(p => new RegExp(escape(p), 'gi')),
      lastName ? new RegExp(`(?:Prof\.?|Professor)\\s+${escape(lastName)}`, 'gi') : null,
    ].filter(Boolean);
    const scrub = (text) => {
      if (!text) return text;
      let result = String(text);
      for (const re of nameRegexes) result = result.replace(re, 'the faculty member');
      return result;
    };

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

    const highlightsTeachingNote = `Highlights teaching section (write one paragraph summarizing course improvement activities only — do NOT summarize eval scores): ${scrub(h.teaching_section || h.curriculum_development || 'None')}`;

    const prompt = `Evaluate this faculty highlights form. Return ONLY valid JSON, no markdown.
              Structure: {"teaching":{"rating":${finalTeachingRating},"comments":""},"scholarship":{"rating":1-5,"disseminated":"Y/N","comments":""},"service":{"rating":1-5,"comments":""},"administrative":{"rating":1-5,"comments":""},"overall":{"rating":3-5,"comments":""}}
              IMPORTANT: Do NOT use any person's name anywhere in your response. Refer to the faculty member only as "the faculty member" or "they".
              For teaching comments, write ONLY one paragraph summarizing course improvement activities from the highlights teaching section. Do NOT repeat or rewrite the teaching eval summary — it will be prepended separately. The teaching rating is already set to ${finalTeachingRating}.
              For all other sections write 3-5 sentences. The overall rating must be 3, 4, or 5.

              Faculty rank: ${h.rank || 'Faculty'}
              ${highlightsTeachingNote}
              Mentoring: ${scrub(mentoringText)}
              Publications (${publications.length}): ${publications.map(p => p.title).join('; ') || 'None'}
              Grants (${grants.length}): ${grants.map(g => g.title).join('; ') || 'None'}
              Significant outcomes: ${scrub(h.significant_outcomes || 'None')}
              Service: ${scrub(h.service_section || 'None')} | Hours: ${totalServiceHours ?? 'N/A'}
              Administrative: ${scrub(h.administrative_responsibilities || 'None')}
              Professional Development: ${scrub(h.professional_development || 'None')}`;

    const cached = summaryCache.get(formId);
    if (cached && cached.expiresAt > Date.now() && req.query.refresh !== 'true') return res.json({ summary: cached.summary, cached: true });

    if (req.query.refresh !== 'true') {
      const stored = await withConn(conn => loadSummaryFromDB(conn, { formId, type: 'form' }));
      if (stored) {
        summaryCache.set(formId, { summary: stored, expiresAt: Date.now() + CACHE_TTL_MS });
        return res.json({ summary: stored, cached: true });
      }
    }

    const result = await getGenAIModel().generateContent(prompt);
    if (!result) throw new Error('No result from model');
    const rawText = scrub(result.response.text().trim().replace(/^```json\s*|^```\s*|\s*```$/g, ''));
    let summary;
    try {
      summary = JSON.parse(rawText);
    } catch {
      summary = { overall: { rating: null, comments: rawText } };
    }
    // Also walk the parsed object to catch any remaining name strings
    const scrubObj = (obj) => {
      if (typeof obj === 'string') return scrub(obj);
      if (typeof obj === 'object' && obj !== null)
        return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, scrubObj(v)]));
      return obj;
    };
    summary = scrubObj(summary);
    // Override teaching rating and prepend eval summary as paragraph 1
    if (summary.teaching) {
      summary.teaching.rating = finalTeachingRating;
      const p1 = teachingEvalSummary || 'No teaching evaluation data available.';
      const p2 = summary.teaching.comments || '';
      summary.teaching.comments = `${p1}

${p2}`.trim();
    }
    // Clamp overall to minimum 3
    if (summary.overall?.rating != null) summary.overall.rating = Math.max(3, summary.overall.rating);
    summaryCache.set(formId, { summary, expiresAt: Date.now() + CACHE_TTL_MS });
    await withConn(conn => saveSummaryToDB(conn, { formId, type: 'form', summary }));
    res.json({ summary });
  } catch (err) {
    if (err.status === 429 || err.statusCode === 429 || String(err?.message).includes('429')) return res.status(429).json({ error: 'AI quota exceeded. Please try again later.' });
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

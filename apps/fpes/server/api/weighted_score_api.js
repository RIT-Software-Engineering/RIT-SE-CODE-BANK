const pool = require('../db');

/**
 * Calculates a weighted final score from per-category ratings and weights.
 * Weights must sum to 10.
 * @param {Object} ratings - { teaching, scholarship, service, administrative } each 1–5
 * @param {Object} weights - { teaching, scholarship, service, administrative } summing to 10
 * @returns {{ breakdown: Array, finalScore: number }}
 */
function calculateWeightedScore(ratings, weights) {
  const total = Object.values(weights).reduce((s, w) => s + Number(w), 0);
  if (Math.abs(total - 10) > 0.01) throw new Error(`Weights must sum to 10, got ${total}`);

  const categories = ['teaching', 'scholarship', 'service', 'administrative'];
  const breakdown = categories.map(cat => ({
    category: cat,
    rating: Number(ratings[cat] ?? 0),
    weight: Number(weights[cat]),
    contribution: Number(ratings[cat] ?? 0) * Number(weights[cat]),
  }));

  const finalScore = breakdown.reduce((s, b) => s + b.contribution, 0);
  return { breakdown, finalScore: Math.round(finalScore * 100) / 100 };
}

/**
 * Helper — acquires a DB connection, runs fn(conn), then releases.
 * @param {Function} fn
 */
async function withConn(fn) {
  const conn = await pool.getConnection();
  try { return await fn(conn); } finally { conn.release(); }
}

/**
 * Fetches the current category weights from the DB.
 * Falls back to defaults (teaching=4, scholarship=3, service=2, administrative=1) if no row exists.
 * @returns {{ teaching: number, scholarship: number, service: number, administrative: number }}
 */
async function getWeights() {
  const rows = await withConn(conn => conn.query('SELECT * FROM category_weights LIMIT 1'));
  if (rows.length === 0) return { teaching: 4, scholarship: 3, service: 2, administrative: 1 };
  const { teaching, scholarship, service, administrative } = rows[0];
  return { teaching: Number(teaching), scholarship: Number(scholarship), service: Number(service), administrative: Number(administrative) };
}

/**
 * Updates the category weights in the DB. Weights must sum to 10.
 * @param {{ teaching: number, scholarship: number, service: number, administrative: number }} weights
 * @returns {{ teaching: number, scholarship: number, service: number, administrative: number }}
 */
async function updateWeights({ teaching, scholarship, service, administrative }) {
  const total = Number(teaching) + Number(scholarship) + Number(service) + Number(administrative);
  if (Math.abs(total - 10) > 0.01) throw new Error(`Weights must sum to 10, got ${total}`);
  await withConn(conn => conn.query(
    'UPDATE category_weights SET teaching=?, scholarship=?, service=?, administrative=?',
    [teaching, scholarship, service, administrative]
  ));
  return { teaching, scholarship, service, administrative };
}

/**
 * Calculates a scholarship score (1–4) based on publication count percentile
 * and grant activity on the given form.
 *
 * Base score from publication percentile:
 *   >= 70th → 4 (Top 30%)
 *   >= 50th → 3 (Top 50%)
 *   >= 30th → 2 (Average)
 *   < 30th  → 1 (Below Average)
 *
 * Bump rule: +1 (capped at 4) if a Funded or In Submission grant exists on the form.
 *
 * @param {number} facultyId - Faculty member's ID
 * @param {number|null} formId - Form ID to check for grants (optional)
 * @returns {{ score: number, pubCount: number, percentile: number, pubLevel: string, hasNewGrant: boolean, bumped: boolean }}
 */
async function calculateScholarshipScore(facultyId, formId) {
  const conn = await pool.getConnection();
  try {
    const allPubCounts = await conn.query(`
      SELECT f.faculty_information_id, COUNT(fp.publication_id) as pub_count
      FROM forms f
      LEFT JOIN forms_publications fp ON f.id = fp.form_id
      GROUP BY f.faculty_information_id
    `);

    const thisFaculty = allPubCounts.find(r => r.faculty_information_id == facultyId);
    const pubCount = Number(thisFaculty?.pub_count ?? 0);
    const total = allPubCounts.length;
    const rank = allPubCounts.filter(r => Number(r.pub_count) < pubCount).length;
    const percentile = total > 1 ? (rank / (total - 1)) * 100 : 100;

    let baseScore, pubLevel;
    if (percentile >= 70) { baseScore = 4; pubLevel = 'Top 30%'; }
    else if (percentile >= 50) { baseScore = 3; pubLevel = 'Top 50%'; }
    else if (percentile >= 30) { baseScore = 2; pubLevel = 'Average'; }
    else { baseScore = 1; pubLevel = 'Below Average'; }

    let hasNewGrant = false;
    if (formId) {
      const grants = await conn.query(
        `SELECT grant_status FROM grants g JOIN forms_grants fg ON g.grant_id = fg.grant_id WHERE fg.form_id = ?`,
        [formId]
      );
      hasNewGrant = grants.some(g => ['Funded', 'In Submission'].includes(g.grant_status));
    }

    const finalScore = Math.min(4, hasNewGrant ? baseScore + 1 : baseScore);
    return { score: finalScore, pubCount, percentile: Math.round(percentile * 10) / 10, pubLevel, hasNewGrant, bumped: hasNewGrant && baseScore < 4 };
  } finally {
    conn.release();
  }
}

/**
 * Returns per-class teaching eval averages for a faculty member,
 * each compared against the department average.
 * @param {number} facultyId - Faculty member's ID
 * @returns {Array<{ semester: string, year: string, class_avg: number, dept_avg: number, diff: number, alignment: string }>}
 */
async function getPerClassTeachingBreakdown(facultyId) {
  const conn = await pool.getConnection();
  try {
    const rows = await conn.query(`
      SELECT te.course_name, te.semester, te.year,
             AVG(CAST(teq.avg AS DECIMAL(5,2))) as class_avg,
             AVG(CAST(teq.swen_avg AS DECIMAL(5,2))) as dept_avg
      FROM teaching_evals te
      JOIN forms f ON te.form_id = f.id
      JOIN teaching_eval_questions teq ON te.id = teq.teaching_eval_id
      WHERE f.faculty_information_id = ? AND teq.avg IS NOT NULL AND teq.avg != ''
      GROUP BY te.id, te.course_name, te.semester, te.year
      ORDER BY te.year DESC, te.semester DESC
    `, [facultyId]);

    const mapped = rows.map(r => ({
      semester: r.semester, year: r.year,
      class_avg: parseFloat(r.class_avg), dept_avg: parseFloat(r.dept_avg),
      diff: Math.round((parseFloat(r.class_avg) - parseFloat(r.dept_avg)) * 100) / 100,
    }));

    const diffs = mapped.map(r => r.diff);
    const mean = diffs.length ? diffs.reduce((s, d) => s + d, 0) / diffs.length : 0;
    const stdDev = diffs.length > 1
      ? Math.sqrt(diffs.reduce((s, d) => s + (d - mean) ** 2, 0) / diffs.length)
      : 0;
    const wellAboveThreshold = mean + stdDev;

    return mapped.map(r => ({
      ...r,
      alignment: (r.diff >= wellAboveThreshold && r.diff >= 0.1) || r.class_avg >= 4.3 ? 'Well Above Average'
        : r.diff >= 0.1 || r.class_avg >= 4.1 ? 'Above Average'
        : r.diff <= -0.1 ? 'Below Average'
        : 'Average',
    }));
  } finally {
    conn.release();
  }
}

module.exports = { calculateWeightedScore, getWeights, updateWeights, calculateScholarshipScore, getPerClassTeachingBreakdown };

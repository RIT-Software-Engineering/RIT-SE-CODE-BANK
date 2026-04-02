const pool = require('../db');

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

async function withConn(fn) {
  const conn = await pool.getConnection();
  try { return await fn(conn); } finally { conn.release(); }
}

async function getWeights() {
  const rows = await withConn(conn => conn.query('SELECT * FROM category_weights LIMIT 1'));
  if (rows.length === 0) return { teaching: 4, scholarship: 3, service: 2, administrative: 1 };
  const { teaching, scholarship, service, administrative } = rows[0];
  return { teaching: Number(teaching), scholarship: Number(scholarship), service: Number(service), administrative: Number(administrative) };
}

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
 * Calculates scholarship score (1-4) based on:
 * - Publication count percentile across all faculty
 * - New grant detection (bumps score by 1 if new/funded grants exist)
 */
async function calculateScholarshipScore(facultyId, formId) {
  const conn = await pool.getConnection();
  try {
    // Get publication counts for all faculty to compute percentile
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

    let baseScore;
    let pubLevel;
    if (percentile >= 70) { baseScore = 4; pubLevel = 'Top 30%'; }
    else if (percentile >= 50) { baseScore = 3; pubLevel = 'Top 50%'; }
    else if (percentile >= 30) { baseScore = 2; pubLevel = 'Average'; }
    else { baseScore = 1; pubLevel = 'Below Average'; }

    // Check for new/funded grants on this form
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
 * Gets per-class teaching eval averages for a faculty member
 * and compares each to the department average.
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

    return rows.map(r => {
      const classAvg = parseFloat(r.class_avg);
      const deptAvg = parseFloat(r.dept_avg);
      const diff = classAvg - deptAvg;
      let alignment;
      if (diff >= 0.2) alignment = 'Above Average';
      else if (diff <= -0.2) alignment = 'Below Average';
      else alignment = 'Average';
      return { course_name: r.course_name, semester: r.semester, year: r.year, class_avg: classAvg, dept_avg: deptAvg, diff: Math.round(diff * 100) / 100, alignment };
    });
  } finally {
    conn.release();
  }
}

/**
 * Maps a final weighted score to a performance tier
 * based on percentile rank across all faculty final scores.
 * Top 30% → 5, top 40% → 4, top 60% → 3, top 80% → 2, else → 1
 */
function calculateFinalTier(finalScore, allScores) {
  if (!allScores || allScores.length === 0) return { tier: null, label: 'Not enough data' };
  const sorted = [...allScores].sort((a, b) => a - b);
  const rank = sorted.filter(s => s < finalScore).length;
  const percentile = (rank / (sorted.length - 1 || 1)) * 100;

  let tier, label;
  if (percentile >= 70) { tier = 5; label = 'Top 30%'; }
  else if (percentile >= 60) { tier = 4; label = 'Top 40%'; }
  else if (percentile >= 40) { tier = 3; label = 'Top 60%'; }
  else if (percentile >= 20) { tier = 2; label = 'Top 80%'; }
  else { tier = 1; label = 'Bottom 20%'; }

  return { tier, label, percentile: Math.round(percentile * 10) / 10 };
}

async function getWeightedScoreForForm(formId, ratings) {
  const weights = await getWeights();
  return calculateWeightedScore(ratings, weights);
}

module.exports = { calculateWeightedScore, getWeights, updateWeights, getWeightedScoreForForm, calculateScholarshipScore, getPerClassTeachingBreakdown, calculateFinalTier };

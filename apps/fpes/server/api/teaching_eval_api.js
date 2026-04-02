const pool = require('../db')
const fs = require('fs')

/**
 * Drops and rebuilds the teaching_evals and teaching_eval_questions tables
 * by executing all SQL statements in sql/teaching_eval.sql.
 * @returns {Array} Array of query results
 */
async function resetTeachingEvalsTables() {
    let connection;
    try {
        const resetQuery = fs.readFileSync("sql/teaching_eval.sql", 'utf-8');
        const queries = resetQuery.split(';');
        queries.pop();
        connection = await pool.getConnection();
        const results = [];
        for (const query of queries) {
            results.push(await connection.query(query));
        }
        return results;
    } finally {
        if (connection) connection.release();
    }
}

/**
 * Saves a parsed teaching evaluation PDF to the database.
 * Creates a form record, looks up the faculty's real name from faculty_information,
 * inserts the teaching eval, and inserts all question rows.
 * @param {Object} data - Parsed eval data from the PDF parser
 * @param {number} data.faculty_id - Faculty member's ID
 * @param {string} [data.course_code] - Course code (e.g. "SWEN-261")
 * @param {string} [data.course_name] - Course name
 * @param {string} [data.semester] - Semester (e.g. "Fall")
 * @param {string} [data.year] - Year (e.g. "2024")
 * @param {string} [data.pdf_data] - Base64-encoded PDF binary
 * @param {Array}  [data.table] - Array of question objects
 * @returns {{ success: boolean, evalId: number, formId: number }}
 */
async function saveParsedTeachingEval(data) {
    const conn = await pool.getConnection();
    try {
        const pdfBuffer = data.pdf_data ? Buffer.from(data.pdf_data, 'base64') : null;

        const formResult = await conn.query(
            'INSERT INTO forms (faculty_information_id, time_submitted, pdf_data) VALUES (?, NOW(), ?)',
            [data.faculty_id, pdfBuffer]
        );
        const formId = Number(formResult.insertId);

        const courseName = data.course_code && data.course_name
            ? `${data.course_code} ${data.course_name}`
            : data.course_name || data.course_code || null;

        // Use the faculty's actual name from faculty_information, not the PDF-parsed name
        const facultyRows = await conn.query(
            'SELECT name FROM faculty_information WHERE faculty_id = ?',
            [data.faculty_id]
        );
        const professorName = facultyRows[0]?.name || data.professor_name;

        const evalResult = await conn.query(
            'INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year) VALUES (?, ?, ?, ?, ?)',
            [formId, courseName, professorName, data.semester, data.year]
        );
        const evalId = Number(evalResult.insertId);

        if (data.table && Array.isArray(data.table)) {
            for (const question of data.table) {
                await conn.query(
                    `INSERT INTO teaching_eval_questions
                    (teaching_eval_id, question_number, question, n, yes, no,
                     str_agree, agree, neutral, disagree, str_disagree,
                     uni_avg, col_avg, swen_avg, avg, top_two)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                    [evalId, question.question_number, question.question, question.n,
                     question.yes || null, question.no || null,
                     question.str_agree || null, question.agree || null, question.neutral || null,
                     question.disagree || null, question.str_disagree || null,
                     question.uni_avg, question.col_avg, question.swen_avg, question.avg, question.top_two]
                );
            }
        }

        return { success: true, evalId, formId };
    } finally {
        conn.release();
    }
}

/**
 * Returns teaching eval percentile rankings for all faculty members.
 * Uses PERCENT_RANK() window function over average eval scores.
 * Faculty name is sourced from faculty_information, not the eval record.
 * @returns {Array<{ professor_name: string, overall_avg: number, eval_count: number, percentile: number }>}
 */
async function getFacultyTeachingEvalPercentiles() {
    const conn = await pool.getConnection();
    try {
        const result = await conn.query(`
            WITH faculty_avg_scores AS (
                SELECT
                    fi.name as professor_name,
                    AVG(CAST(teq.avg AS DECIMAL(5,2))) as overall_avg,
                    COUNT(DISTINCT te.id) as eval_count
                FROM teaching_evals te
                JOIN forms f ON te.form_id = f.id
                JOIN faculty_information fi ON f.faculty_information_id = fi.faculty_id
                JOIN teaching_eval_questions teq ON te.id = teq.teaching_eval_id
                WHERE teq.avg IS NOT NULL AND teq.avg != ''
                GROUP BY fi.faculty_id, fi.name
            )
            SELECT
                professor_name,
                CAST(overall_avg AS DECIMAL(5,2)) as overall_avg,
                CAST(eval_count AS UNSIGNED) as eval_count,
                CAST(PERCENT_RANK() OVER (ORDER BY overall_avg) * 100 AS DECIMAL(5,2)) as percentile
            FROM faculty_avg_scores
            ORDER BY percentile DESC
        `);
        return result.map(row => ({
            professor_name: row.professor_name,
            overall_avg: parseFloat(row.overall_avg),
            eval_count: parseInt(row.eval_count),
            percentile: parseFloat(row.percentile)
        }));
    } finally {
        conn.release();
    }
}

/**
 * Returns the percentile ranking for a specific faculty member by their ID.
 * Matches evals through the forms table using faculty_information_id,
 * so results are accurate even if the PDF-parsed professor name differs.
 * @param {number} facultyId - The faculty member's ID
 * @returns {{ professor_name: string, overall_avg: number, eval_count: number, percentile: number } | null}
 */
async function getFacultyPercentileById(facultyId) {
    const conn = await pool.getConnection();
    try {
        const allResults = await conn.query(`
            WITH faculty_avg_scores AS (
                SELECT
                    f.faculty_information_id,
                    fi.name as faculty_name,
                    AVG(CAST(teq.avg AS DECIMAL(5,2))) as overall_avg,
                    COUNT(DISTINCT te.id) as eval_count
                FROM teaching_evals te
                JOIN forms f ON te.form_id = f.id
                JOIN faculty_information fi ON f.faculty_information_id = fi.faculty_id
                JOIN teaching_eval_questions teq ON te.id = teq.teaching_eval_id
                WHERE teq.avg IS NOT NULL AND teq.avg != ''
                GROUP BY f.faculty_information_id, fi.name
            )
            SELECT
                faculty_information_id,
                faculty_name,
                CAST(overall_avg AS DECIMAL(5,2)) as overall_avg,
                CAST(eval_count AS UNSIGNED) as eval_count,
                CAST(PERCENT_RANK() OVER (ORDER BY overall_avg) * 100 AS DECIMAL(5,2)) as percentile
            FROM faculty_avg_scores
        `);

        const result = allResults.find(r => r.faculty_information_id == facultyId);
        if (!result) return null;

        return {
            professor_name: result.faculty_name,
            overall_avg: parseFloat(result.overall_avg),
            eval_count: parseInt(result.eval_count),
            percentile: parseFloat(result.percentile)
        };
    } finally {
        conn.release();
    }
}

/**
 * Keywords indicating substantial course improvement in a faculty's teaching highlights text.
 * Two or more matches trigger a score bump from 3 → 4.
 */
const IMPROVEMENT_KEYWORDS = [
    'new assignment', 'new assignments', 'redesigned', 'restructured', 'revised',
    'updated syllabus', 'new syllabus', 'added', 'introduced', 'overhauled',
    'improved', 'modified course', 'changed', 'developed new', 'created new',
    'new project', 'new lab', 'new module', 'new curriculum'
];

/**
 * Calculates a teaching score (2–4) based on percentile rank and course improvement keywords.
 *
 * Base score from percentile:
 *   >= 70th → 4 (Above Average)
 *   30–70th → 3 (Average)
 *   < 30th  → 2 (Below Average)
 *
 * Bump rule: base score of 3 → 4 if 2+ improvement keywords found in teachingText.
 *
 * @param {number} facultyId - Faculty member's ID
 * @param {string} [teachingText] - Teaching section text from the highlights form
 * @returns {{ score: number|null, percentile: number|null, level: string, bumped: boolean, matchedKeywords: string[], overall_avg: number|null }}
 */
async function calculateTeachingScore(facultyId, teachingText = '') {
    const percentileData = await getFacultyPercentileById(facultyId);

    let baseScore = null;
    let percentile = null;
    let level = 'No eval data';

    if (percentileData) {
        percentile = percentileData.percentile;
        if (percentile >= 70) { baseScore = 4; level = 'Above Average'; }
        else if (percentile >= 30) { baseScore = 3; level = 'Average'; }
        else { baseScore = 2; level = 'Below Average'; }
    }

    const text = teachingText.toLowerCase();
    const matchedKeywords = IMPROVEMENT_KEYWORDS.filter(k => text.includes(k));
    const bumped = baseScore === 3 && matchedKeywords.length >= 2;
    const finalScore = bumped ? 4 : baseScore;

    return {
        score: finalScore,
        percentile,
        level,
        bumped,
        matchedKeywords,
        overall_avg: percentileData?.overall_avg ?? null
    };
}

module.exports = {
    resetTeachingEvalsTables,
    saveParsedTeachingEval,
    getFacultyTeachingEvalPercentiles,
    getFacultyPercentileById,
    calculateTeachingScore
}

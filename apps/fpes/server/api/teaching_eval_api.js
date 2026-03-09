/**
 * Teaching Evaluation Percentile API
 * 
 * Provides endpoints for calculating and retrieving faculty teaching evaluation percentiles.
 * Percentiles are calculated using SQL window functions to rank faculty performance relative
 * to their peers based on average teaching evaluation scores.
 */

const pool = require('../db')
const fs = require('fs')


async function resetTeachingEvalsTables(){
    let connection;
    try {
        // Read sql file that rebuilds services table and inserts test data
        const resetQuery = await fs.readFileSync("sql/teaching_eval.sql", 'utf-8');
        // Splits file into multiple queries
        let queries = resetQuery.split(';');
        // Removes the empty query at the end
        queries.pop();

        connection = await pool.getConnection();
        let results = [];
        for (const query of queries){
            results.push(await connection.query(query));
        }

        return results;
    } finally {
        if (connection) connection.release();
    } 
}

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
        
        const evalResult = await conn.query(
            'INSERT INTO teaching_evals (form_id, course_name, professor_name, semester, year) VALUES (?, ?, ?, ?, ?)',
            [formId, courseName, data.professor_name, data.semester, data.year]
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
 * Calculates teaching evaluation percentiles for all faculty members.
 * 
 * Uses a SQL window function (PERCENT_RANK) to determine where each faculty member
 * ranks relative to others based on their average teaching evaluation scores.
 * 
 * @returns {Array} Array of faculty with percentile rankings, sorted highest to lowest
 */
async function getFacultyTeachingEvalPercentiles() {
    const conn = await pool.getConnection();
    try {
        const result = await conn.query(`
            WITH faculty_avg_scores AS (
                SELECT 
                    te.professor_name,
                    AVG(CAST(teq.avg AS DECIMAL(5,2))) as overall_avg,
                    COUNT(DISTINCT te.id) as eval_count
                FROM teaching_evals te
                JOIN teaching_eval_questions teq ON te.id = teq.teaching_eval_id
                WHERE teq.avg IS NOT NULL AND teq.avg != ''
                GROUP BY te.professor_name
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

async function getFacultyPercentileByName(professorName) {
    const conn = await pool.getConnection();
    try {
        const result = await conn.query(`
            WITH faculty_avg_scores AS (
                SELECT 
                    te.professor_name,
                    AVG(CAST(teq.avg AS DECIMAL(5,2))) as overall_avg,
                    COUNT(DISTINCT te.id) as eval_count
                FROM teaching_evals te
                JOIN teaching_eval_questions teq ON te.id = teq.teaching_eval_id
                WHERE teq.avg IS NOT NULL AND teq.avg != ''
                GROUP BY te.professor_name
            )
            SELECT 
                professor_name,
                CAST(overall_avg AS DECIMAL(5,2)) as overall_avg,
                CAST(eval_count AS UNSIGNED) as eval_count,
                CAST(PERCENT_RANK() OVER (ORDER BY overall_avg) * 100 AS DECIMAL(5,2)) as percentile
            FROM faculty_avg_scores
            WHERE professor_name = ?
        `, [professorName]);
        if (!result[0]) return null;
        return {
            professor_name: result[0].professor_name,
            overall_avg: parseFloat(result[0].overall_avg),
            eval_count: parseInt(result[0].eval_count),
            percentile: parseFloat(result[0].percentile)
        };
    } finally {
        conn.release();
    }
}

/**
 * Gets percentile ranking for a specific faculty member by their ID.
 * 
 * Matches teaching evals by the faculty_id who submitted them, not by professor name yetttt.
 * This allows faculty to see their percentile even if the professor name in the eval
 * doesn't exactly match their name in the faculty_information table.
 * 
 * @param {number} facultyId - The faculty member's ID
 * @returns {Object|null} Faculty percentile data or null if not found
 */
async function getFacultyPercentileById(facultyId) {
    const conn = await pool.getConnection();
    try {
        // Get all percentiles calculated by faculty_id instead of professor_name
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
        
        // Find the matching faculty member
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

module.exports = {
    resetTeachingEvalsTables,
    saveParsedTeachingEval,
    getFacultyTeachingEvalPercentiles,
    getFacultyPercentileByName,
    getFacultyPercentileById
}

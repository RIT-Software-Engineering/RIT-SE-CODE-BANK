/**
 * Teaching Evaluation Percentile API
 * 
 * Provides endpoints for calculating and retrieving faculty teaching evaluation percentiles.
 * Percentiles are calculated using SQL window functions to rank faculty performance relative
 * to their peers based on average teaching evaluation scores.
 */

const pool = require('../db')
const fs = require('fs')
const { GoogleGenerativeAI } = require('@google/generative-ai')
require('dotenv').config()

function getModel() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_KEY);
  return genAI.getGenerativeModel({ model: 'gemini-3.1-flash-lite-preview' });
}

function escapeRegExp(value) {
        return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}


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

        if (data.text_responses && Array.isArray(data.text_responses)) {
            for (const section of data.text_responses) {
                // Upsert the question text and get its id
                await conn.query(
                    'INSERT INTO teaching_eval_text_questions (question) VALUES (?) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)',
                    [section.question]
                );
                const [{ id: questionId }] = await conn.query(
                    'SELECT id FROM teaching_eval_text_questions WHERE question = ?',
                    [section.question]
                );

                for (const response of section.responses) {
                    await conn.query(
                        'INSERT INTO teaching_eval_text_responses (teaching_eval_id, question_id, response) VALUES (?, ?, ?)',
                        [evalId, questionId, response]
                    );
                }
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

async function summarizeTeachingEval(formId) {
    const conn = await pool.getConnection();
    try {
        const evalData = await conn.query(
            `SELECT te.professor_name, te.course_name, te.semester, te.year
             FROM teaching_evals te JOIN forms f ON te.form_id = f.id WHERE f.id = ?`,
            [formId]
        );
        if (!evalData[0]) throw new Error('Teaching eval not found');

        const questions = await conn.query(
            `SELECT question, avg, swen_avg, top_two
             FROM teaching_eval_questions teq
             JOIN teaching_evals te ON teq.teaching_eval_id = te.id
             JOIN forms f ON te.form_id = f.id
             WHERE f.id = ? ORDER BY CAST(question_number AS UNSIGNED)`,
            [formId]
        );

        // Fetch text responses
        const textResponses = await conn.query(
            `SELECT q.question, r.response
             FROM teaching_eval_text_questions q
             LEFT JOIN teaching_eval_text_responses r ON q.id = r.question_id
             WHERE r.teaching_eval_id = (SELECT id FROM teaching_evals WHERE form_id = ?)
             ORDER BY q.id`,
            [formId]
        );

        // removed before entering gemini
        const { professor_name, course_name } = evalData[0];

        const questionLines = questions.map(q =>
            `- ${q.question}: avg=${q.avg}, dept_avg=${q.swen_avg}, top_two=${q.top_two}%`
        ).join('\n');

        // Group text responses by question
        const textResponsesGrouped = {};
        for (const row of textResponses) {
            if (!textResponsesGrouped[row.question]) {
                textResponsesGrouped[row.question] = [];
            }
            if (row.response) {
                textResponsesGrouped[row.question].push(row.response);
            }
        }

        // Filter PII from text responses
        const filterPII = (text) => {
            if (!text) return text;
            let filtered = text;
            
            // Replace professor name (case-insensitive)
            if (professor_name) {
                const nameRegex = new RegExp(escapeRegExp(professor_name), 'gi');
                filtered = filtered.replace(nameRegex, '[PROFESSOR]');
            }

            // Replace title + name patterns that might be generated (e.g., "Professor Meneely")
            filtered = filtered.replace(/\b(professor|prof\.?|dr\.?|instructor)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\b/g, '$1 [PROFESSOR]');

            // Replace standalone full-name patterns (conservative two-token names)
            filtered = filtered.replace(/\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g, '[NAME]');
            
            // Replace course name/code (case-insensitive)
            if (course_name) {
                const escapedCourse = escapeRegExp(course_name).replace(/\s+/g, '\\s+');
                const courseRegex = new RegExp(escapedCourse, 'gi');
                filtered = filtered.replace(courseRegex, '[COURSE]');
            }

            // Replace common course code patterns (e.g., SWEN-261, CSCI 250, ISTE340)
            filtered = filtered.replace(/\b[A-Z]{2,5}[\s-]?\d{2,4}[A-Z]?\b/g, '[COURSE]');

            // Replace quoted course-like titles after "course" label
            filtered = filtered.replace(/\bcourse\s+['\"]?[^'\"\n]{2,80}['\"]?/gi, 'course [COURSE]');
            
            // Remove email addresses
            filtered = filtered.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[EMAIL]');
            
            // Remove common student identifiers (e.g., RIT ID patterns)
            filtered = filtered.replace(/\b\d{9}\b/g, '[ID]');
            
            return filtered;
        };

        // Apply PII filtering to all responses
        const textResponsesFiltered = {};
        for (const [question, responses] of Object.entries(textResponsesGrouped)) {
            textResponsesFiltered[question] = responses.map(r => filterPII(r));
        }

        const textResponsesLines = Object.entries(textResponsesFiltered).map(([question, responses]) =>
            `- ${question}:\n${responses.map(r => `  "${r}"`).join('\n')}`
        ).join('\n\n');

        const prompt = `You are summarizing a teaching evaluation for a faculty review system.

        Question scores (avg out of 5, dept avg, % top-two responses):
        ${questionLines}

        ${textResponsesLines ? `Written feedback from students:\n${textResponsesLines}` : ''}

        Write a concise 2-3 sentence summary covering:
        1. Overall teaching performance (above/average/below average vs department)
        2. Specific strengths based on high scores and written feedback
        3. Any areas of concern based on low scores, low top-two percentages, or written feedback
        Be factual and professional.`;

        const result = await getModel().generateContent(prompt);
        const summaryText = result.response.text();
        return filterPII(summaryText);
    } catch (err) {
        if (err.status === 429) throw new Error('AI quota exceeded. Please try again later.');
        throw err;
    } finally {
        conn.release();
    }
}

module.exports = {
    resetTeachingEvalsTables,
    saveParsedTeachingEval,
    getFacultyTeachingEvalPercentiles,
    getFacultyPercentileByName,
    getFacultyPercentileById,
    summarizeTeachingEval
}

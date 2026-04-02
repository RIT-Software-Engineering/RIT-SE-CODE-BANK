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


async function resetTeachingEvalsTables(){
    let connection;
    try {
        const resetQuery = await fs.readFileSync("sql/teaching_eval.sql", 'utf-8');
        let queries = resetQuery.split(';');
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
        
        // Use the faculty's actual name from faculty_information, not the PDF name
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

        const { professor_name, course_name, semester, year } = evalData[0];
        const questionLines = questions.map(q =>
            `- ${q.question}: avg=${q.avg}, dept_avg=${q.swen_avg}, top_two=${q.top_two}%`
        ).join('\n');

        const prompt = `You are summarizing a teaching evaluation for a faculty review system.\n\nProfessor: ${professor_name}\nCourse: ${course_name} (${semester} ${year})\n\nQuestion scores (avg out of 5, dept avg, % top-two responses):\n${questionLines}\n\nWrite a concise 2-3 sentence summary covering:\n1. Overall teaching performance (above/average/below average vs department)\n2. Specific strengths based on high scores\n3. Any areas of concern based on low scores or low top-two percentages\nBe factual and professional.`;

        const result = await getModel().generateContent(prompt);
        return result.response.text();
    } catch (err) {
        if (err.status === 429) throw new Error('AI quota exceeded. Please try again later.');
        throw err;
    } finally {
        conn.release();
    }
}

const IMPROVEMENT_KEYWORDS = [
    'new assignment', 'new assignments', 'redesigned', 'restructured', 'revised',
    'updated syllabus', 'new syllabus', 'added', 'introduced', 'overhauled',
    'improved', 'modified course', 'changed', 'developed new', 'created new',
    'new project', 'new lab', 'new module', 'new curriculum'
];

/**
 * Calculates a teaching score (2-4) from percentile + course improvement.
 * Base: top 30% → 4, 30-70% → 3, bottom 30% → 2
 * Bump: average (3) → 4 if substantial course improvement detected
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
    const hasSubstantialImprovement = matchedKeywords.length >= 2;

    let finalScore = baseScore;
    let bumped = false;
    if (baseScore === 3 && hasSubstantialImprovement) {
        finalScore = 4;
        bumped = true;
    }

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
    getFacultyPercentileByName,
    getFacultyPercentileById,
    summarizeTeachingEval,
    calculateTeachingScore
}

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

module.exports = {
    resetTeachingEvalsTables,
    saveParsedTeachingEval
}
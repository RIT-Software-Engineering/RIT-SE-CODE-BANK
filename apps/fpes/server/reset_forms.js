const pool = require('./db');

async function resetForms() {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DELETE FROM teaching_eval_text_responses');
        await connection.query('DELETE FROM teaching_eval_questions');
        await connection.query('DELETE FROM teaching_eval_text_questions');
        await connection.query('DELETE FROM teaching_evals');
        await connection.query('DELETE FROM highlights');
        await connection.query('DELETE FROM forms_grants');
        await connection.query('DELETE FROM forms');
        await connection.query('ALTER TABLE forms AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE teaching_evals AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE teaching_eval_questions AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE teaching_eval_text_questions AUTO_INCREMENT = 1');
        await connection.query('ALTER TABLE teaching_eval_text_responses AUTO_INCREMENT = 1');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Forms and teaching evaluations reset successfully');
    } catch (error) {
        console.error('Reset failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

resetForms();

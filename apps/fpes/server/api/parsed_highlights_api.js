const pool = require('../db');

async function saveParsedHighlights(data) {
    const conn = await pool.getConnection();
    try {
        // First create a form entry
        const formResult = await conn.query(
            `INSERT INTO forms (faculty_information_id, time_submitted) VALUES (?, NOW())`,
            [data.faculty_id]
        );
        
        const formId = Number(formResult.insertId);
        
        // Then save highlights with the new form_id
        const result = await conn.query(
            `INSERT INTO highlights (form_id, administrative_responsibilities, last_saved) 
             VALUES (?, ?, NOW())`,
            [formId, data.administrative]
        );
        return { success: true, id: Number(result.insertId) };
    } finally {
        conn.release();
    }
}

module.exports = { saveParsedHighlights };

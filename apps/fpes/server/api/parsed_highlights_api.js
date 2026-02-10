const pool = require('../db');

async function saveParsedHighlights(data) {
    const conn = await pool.getConnection();
    try {
        const result = await conn.query(
            `INSERT INTO highlights (faculty_information_id, scholarship, teaching, service, administrative, last_saved) 
             VALUES (?, ?, ?, ?, ?, NOW())`,
            [data.faculty_id, data.scholarship, data.teaching, data.service, data.administrative]
        );
        return result;
    } finally {
        conn.release();
    }
}

module.exports = { saveParsedHighlights };

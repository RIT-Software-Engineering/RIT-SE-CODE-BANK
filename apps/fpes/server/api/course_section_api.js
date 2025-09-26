const pool = require('../db')
const fs = require('fs')

async function getAllCourseSections(){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM course_section");
        return results;
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    getAllCourseSections
}
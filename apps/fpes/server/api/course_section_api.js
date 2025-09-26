const pool = require('../db')
const fs = require('fs')

async function getAllCourseSections(){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM course_sections");
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function getSectionsByCourseID(course_id){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM course_sections WHERE course_id = ?", [course_id]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}


async function initCourseSectionsTable(){
    let connection;
    try {
        // Read sql file that rebuilds course_sections table and inserts test data
        const resetQuery = await fs.readFileSync("sql/course_sections.sql", 'utf-8');
        // Splits file into multiple queries
        let queries = resetQuery.split(';');
        // Removes the empty query at the end
        queries.pop();

        connection = await pool.getConnection();
        let results = [];
        for (const query of queries){
            results += await connection.query(query);
        }

        return results;
    } finally {
        if (connection) connection.release();
    } 
}

module.exports = {
    getAllCourseSections,
    initCourseSectionsTable,
    getSectionsByCourseID
}
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

async function getSectionByID(id){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM course_sections WHERE id = ?", [id]);
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

async function getSectionBySemesterAndYear(year, semester){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM course_sections WHERE scholastic_year = ? AND semester = ?", [year, semester])
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function getSectionByYear(year){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM course_sections WHERE scholastic_year = ?", [year])
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
            results += await connection.query(query); //results.push(await connection.query(query));
        }

        return results;
    } finally {
        if (connection) connection.release();
    } 
}

async function createCourseSection(body){
    let connection;
    try {
        connection = await pool.getConnection();
        const {course_id, room_location, days_of_the_week, number_of_students, semester, scholastic_year} = body;

        const results = await connection.query(
            `INSERT INTO course_sections (course_id, room_location, days_of_the_week, number_of_students, semester, scholastic_year)
            VALUES (?,?,?,?,?,?)`,
            [course_id, room_location, days_of_the_week, number_of_students, semester, scholastic_year]
        );

        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function updateCourseSection(id, body){
    let connection;
    try {
        connection = await pool.getConnection();
        const {course_id, room_location, days_of_the_week, number_of_students, semester, scholastic_year} = body;

        const results = await connection.query(
            `UPDATE course_sections SET 
            course_id = ?, room_location = ?, days_of_the_week = ?, number_of_students = ?, semester = ?, scholastic_year = ?
            WHERE id = ?`,
            [course_id, room_location, days_of_the_week, number_of_students, semester, scholastic_year, id]
        );

        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function removeCourseSectionByID(id){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query(
            `DELETE FROM course_sections WHERE id = ?`, [id]
        );

        return results;
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    getAllCourseSections,
    initCourseSectionsTable,
    getSectionsByCourseID,
    getSectionByID,
    createCourseSection,
    removeCourseSectionByID,
    updateCourseSection,
    getSectionBySemesterAndYear,
    getSectionByYear
}
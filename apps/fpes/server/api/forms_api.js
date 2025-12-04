const pool = require("../db");
const fs = require('fs')

// READ : all forms
async function getAllForms(){
    let connection;
    try {
        connection = await pool.getConnection();
        return await connection.query('SELECT * FROM forms');
    } finally {
        if (connection) connection.release();
    }
}

// READ : form by a specific id
async function getFormById(id){
    let connection;
    try {
        connection = await pool.getConnection();
        return await connection.query('SELECT * FROM forms WHERE id = ?', [id]);
    } finally {
        if (connection) connection.release();
    }
}

// READ : forms with a given faculty id
async function getFormByFacultyId(facultyId){
    let connection;
    try {
        connection = await pool.getConnection();
        return await connection.query('SELECT * FROM forms WHERE faculty_information_id = ?', [facultyId]);
    } finally {
        if (connection) connection.release();
    }
}

// CREATE : create form record with a timestamp and faculty id
async function createForm(formData){
    let connection;
    try {
        connection = await pool.getConnection();
        const {
            faculty_information_id,
            isSubmission,
        } = formData;
        let submissionTimestamp = 0;
        if (isSubmission){
            submissionTimestamp = Date.now();
        }
        return await connection.query('INSERT INTO forms (faculty_information_id, time_submitted) VALUES (?,FROM_UNIXTIME(?)) RETURNING id', [faculty_information_id, submissionTimestamp / 1000]);
    } finally {
        if (connection) connection.release();
    }
}

// DELETE : deletes from with a given id
async function deleteForm(id){
    let connection;
    try {
        connection = await pool.getConnection();
        return await connection.query('DELETE FROM forms WHERE id = ?', [id]);
    } finally {
        if (connection) connection.release();
    }
}

// RESET
// Reset
async function resetFormsTable(){
    let connection;
    try {
        // Read sql file that rebuilds grants table and inserts test data
        const resetQuery = await fs.readFileSync("sql/forms.sql", 'utf-8');
        // Splits file into multiple queries
        let queries = resetQuery.split(';');
        // Removes the empty query at the end
        queries.pop();

        connection = await pool.getConnection();
        let results = [];
        for (const query of queries){
            await connection.query(query);
        }

        return;
    } finally {
        if (connection) connection.release();
    } 
}

module.exports = {
    getAllForms,
    getFormByFacultyId,
    getFormById,
    createForm,
    deleteForm,
    resetFormsTable
}
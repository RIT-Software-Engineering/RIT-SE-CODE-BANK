const pool = require("../db");

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

module.exports = {
    getAllForms,
    getFormByFacultyId,
    getFormById,
    createForm,
    deleteForm,
}
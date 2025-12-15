const pool = require("../db");
const fs = require('fs')
const { getFacultyById } = require("./faculty_api");
const { getCourseSectionsOfForm, getGrantsOfForm, getPublicationsOfForm, getServicesOfForm } = require("./forms_to_dynamics_tables_api");

const { getStudentSupportById } = require("./student_support_api");

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


// READ : get form of a specific id in preview format
async function getFormByIdInViewFormat(id){
    const { getHighlightByFormId } = require("./highlights_api");

    const formData = {}

    // Gets the basic form information like facultyId
    const formResponse = await getFormById(id);

    const facultyId = formResponse[0].faculty_information_id;
    const highlightsData = await getHighlightByFormId(id);

    const studentSupportId = highlightsData[0].student_support_id;

    formData.highlights = highlightsData[0];

    const facultyInformation = await getFacultyById(facultyId);
    formData.faculty_information = facultyInformation;

    const courseSections = await getCourseSectionsOfForm(id);
    formData.course_sections = courseSections;

    const grants = await getGrantsOfForm(id);
    formData.grants = grants;

    const publications = await getPublicationsOfForm(id);
    formData.publications = publications;

    const services = await getServicesOfForm(id);
    formData.services = services;

    const studentSupport = await getStudentSupportById(studentSupportId);
    formData.student_support = studentSupport;

    return formData;
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

async function getFormsBySupervisorId(supervisorId){
    let connection;
    try {
        connection = await pool.getConnection();
        return await connection.query(
            `SELECT faculty_information.name, forms.* FROM forms INNER JOIN faculty_information
            ON forms.faculty_information_id = faculty_information.faculty_id
            WHERE faculty_information.supervisor_id = ?
            `,
            [supervisorId]
        )
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
            isSubmission = true,
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
async function resetFormsTable(){
    let connection;
    try {
        // Read sql file that rebuilds forms table
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
    getFormsBySupervisorId,
    getFormById,
    getFormByIdInViewFormat,
    createForm,
    deleteForm,
    resetFormsTable,
}
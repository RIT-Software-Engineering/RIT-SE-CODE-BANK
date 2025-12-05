const pool = require('../db');

async function assignCourseSectionToForm(form_id, course_section_id){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query(
            `INSERT INTO forms_course_sections (form_id, course_section_id) 
            VALUES (?,?)`, [form_id,course_section_id]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function assignServiceToForm(form_id, service_id){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query(
            `INSERT INTO forms_services (form_id, service_id) 
            VALUES (?,?)`, [form_id, service_id]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function assignPublicationToForm(form_id, publication_id){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query(
            `INSERT INTO forms_publications (form_id, publications_id) 
            VALUES (?,?)`, [form_id, publication_id]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function assignGrantToForm(form_id, grant_id){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query(
            `INSERT INTO forms_grants (form_id, grant_id) 
            VALUES (?,?)`, [form_id, grant_id]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    assignCourseSectionToForm,
    assignGrantToForm,
    assignPublicationToForm,
    assignServiceToForm
}

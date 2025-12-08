const pool = require('../db');
const fs = require('fs')

async function assignCourseSectionToForm(formId, courseSectionId){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query(
            `INSERT INTO forms_course_sections (form_id, course_section_id) 
            VALUES (?,?)`, [formId,courseSectionId]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function assignServiceToForm(formId, serviceId){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query(
            `INSERT INTO forms_services (form_id, service_id) 
            VALUES (?,?)`, [formId, serviceId]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function assignPublicationToForm(formId, publicationId){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query(
            `INSERT INTO forms_publications (form_id, publications_id) 
            VALUES (?,?)`, [formId, publicationId]);
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

async function buildRelationshipTables(){
    let connection;
    try {
        connection = await pool.getConnection();
        const courseSectionsQuery = await fs.readFileSync("sql/form_to_field_tables/forms_course_sections.sql", 'utf-8');
        let queries = buildQuery.split(';');
        queries.pop();

        connection = await pool.getConnection();

        for (const query of queries){
            await connection.query(query);
        }

        const servicesQuery = await fs.readFileSync("sql/form_to_field_tables/forms_services.sql", 'utf-8');
        queries = servicesQuery.split(';');
        queries.pop();

        connection = await pool.getConnection();
        for (const query of queries){
            await connection.query(query);
        }

        const publicationsQuery = await fs.readFileSync("sql/form_to_field_tables/forms_publications.sql", 'utf-8');
        queries = publicationsQuery.split(';');
        queries.pop();

        connection = await pool.getConnection();
        for (const query of queries){
            await connection.query(query);
        }

        const grantsQuery = await fs.readFileSync("sql/form_to_field_tables/forms_grants.sql", 'utf-8');
        queries = grantsQuery.split(';');
        queries.pop();

        connection = await pool.getConnection();
        for (const query of queries){
            await connection.query(query);
        }
    } finally {
        if (connection) connection.release();
    }
}

module.exports = {
    assignCourseSectionToForm,
    assignGrantToForm,
    assignPublicationToForm,
    assignServiceToForm,
    buildRelationshipTables
}

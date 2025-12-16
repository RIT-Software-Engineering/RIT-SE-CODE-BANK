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

async function getCourseSectionsOfForm(formId){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query(
            ` SELECT c.course_name, c.course_code, cs.* FROM course_sections AS cs INNER JOIN forms_course_sections AS fcs
            ON fcs.course_section_id = cs.id INNER JOIN courses AS c ON c.id = cs.course_id
            WHERE fcs.form_id = ?
            `,
            [formId]
        );
        return  results;
    } finally {
        if (connection) connection.release();
    }
}

async function assignServiceToForm(formId, serviceId){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query(
            `INSERT INTO forms_services (form_id, service_id) 
            VALUES (?,?)`, [formId, serviceId]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function getServicesOfForm(formId){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query(
            ` SELECT services.* FROM services INNER JOIN forms_services AS fs
            ON fs.service_id = services.id
            WHERE fs.form_id = ?
            `,
            [formId]
        );
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function assignPublicationToForm(formId, publicationId){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query(
            `INSERT INTO forms_publications (form_id, publication_id) 
            VALUES (?,?)`, [formId, publicationId]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function getPublicationsOfForm(formId){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query(
            ` SELECT publications.* FROM publications INNER JOIN forms_publications AS fp
            ON fp.publication_id = publications.id
            WHERE fp.form_id = ?
            `,
            [formId]
        );
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

async function getGrantsOfForm(formId){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query(
            ` SELECT grants.* FROM grants INNER JOIN forms_grants AS fg
            ON fg.grant_id = grants.grant_id
            WHERE fg.form_id = ?
            `,
            [formId]
        );
        return  results;
    } finally {
        if (connection) connection.release();
    }
}

async function buildRelationshipTables(){
    let connection;
    try {
        connection = await pool.getConnection();
        const courseSectionsQuery = await fs.readFileSync("sql/form_to_field_tables/forms_course_sections.sql", 'utf-8');
        let queries = courseSectionsQuery.split(';');
        queries.pop();

        for (const query of queries){
            await connection.query(query);
        }

        const servicesQuery = await fs.readFileSync("sql/form_to_field_tables/forms_services.sql", 'utf-8');
        queries = servicesQuery.split(';');
        queries.pop();

        for (const query of queries){
            await connection.query(query);
        }

        const publicationsQuery = await fs.readFileSync("sql/form_to_field_tables/forms_publications.sql", 'utf-8');
        queries = publicationsQuery.split(';');
        queries.pop();
        for (const query of queries){
            await connection.query(query);
        }

        const grantsQuery = await fs.readFileSync("sql/form_to_field_tables/forms_grants.sql", 'utf-8');
        queries = grantsQuery.split(';');
        queries.pop();

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
    getCourseSectionsOfForm,
    getServicesOfForm,
    getPublicationsOfForm,
    getGrantsOfForm,
    buildRelationshipTables
}

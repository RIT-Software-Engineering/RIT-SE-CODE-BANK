const pool = require('../db');
const fs = require('fs');
const { resetCourseSectionsTable } = require('./course_section_api');
const { resetCoursesTable } = require('./courses_api');
const { resetDepartmentsTable } = require('./departments_api');
const { resetFacultyTable } = require('./faculty_api');
const { resetFormsTable } = require('./forms_api');
const { resetGrantsTable } = require('./grants_api');
const { resetHighlightsTable } = require('./highlights_api');
const { resetPublicationsTable } = require('./publications_api');
const { resetServicesTable } = require('./service_api');
const { resetStudentSupportTable } = require('./student_support_api');
const { buildRelationshipTables } = require('./forms_to_dynamics_tables_api');
const { resetTeachingEvalsTables } = require('./teaching_eval_api');

async function rebuildTables(){
    let connection;
    try {
        // Read sql file drops all tables in the proper order
        const resetQuery = await fs.readFileSync("sql/drop_tables.sql", 'utf-8');
        // Splits file into multiple queries
        let queries = resetQuery.split(';');
        // Removes the empty query at the end
        queries.pop();

        connection = await pool.getConnection();
        for (const query of queries){
            await connection.query(query);
        }

        // Reset departments
        await resetDepartmentsTable();

        // Reset courses
        await resetCoursesTable();

        // Reset student support
        await resetStudentSupportTable();

        // Reset faculty information
        await resetFacultyTable();

        // Reset forms
        await resetFormsTable();

        // Reset highlights
        await resetHighlightsTable();

        // Reset grants
        await resetGrantsTable();

        // Reset services
        await resetServicesTable();
        
        // Reset course_sections
        await resetCourseSectionsTable();

        // Reset publications
        await resetPublicationsTable();

        await buildRelationshipTables();

        await resetTeachingEvalsTables();

        // Clear all stored evaluations (AI summaries) — safe even if table doesn't exist
        try {
            await connection.query('DELETE FROM form_summaries');
        } catch (err) {
            // Silently ignore if table doesn't exist — user can create it manually if needed
            if (!err.message.includes('Unknown table')) throw err;
        }

        console.log("All tables successfully rebuilt...");

        return;
    } finally {
        if (connection) connection.release();
    } 
}

module.exports = {
    rebuildTables
}
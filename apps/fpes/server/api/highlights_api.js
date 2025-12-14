const pool = require('../db');
const fs = require('fs')

const student_support_api = require('./student_support_api');
const course_sections_api = require('./course_section_api');
const services_api = require('./service_api');
const publications_api = require('./publications_api');
const grants_api = require('./grants_api');
const forms_to_dynamics_api = require('./forms_to_dynamics_tables_api')
const { createForm } = require('./forms_api');


// READ: all
async function getAllHighlights() {
  let connection;
  try {
    connection = await pool.getConnection();
    return await connection.query('SELECT * FROM highlights');
  } finally {
    if (connection) connection.release();
  }
}

// READ: by id
async function getHighlightById(id) {
  let connection;
  try {
    connection = await pool.getConnection();
    const rows = await connection.query('SELECT * FROM highlights WHERE id = ?', [id]);
    return rows[0] || null; //retuns either single row or null
  } finally {
    if (connection) connection.release();
  }
}

// READ: by faculty id
async function getHighlightByFacultyId(facultyId){
  let connection;
  try {
    connection = await pool.getConnection();
    const rows = await connection.query('SELECT highlights.id, forms.time_submitted FROM forms INNER JOIN highlights ON forms.id = highlights.form_id WHERE forms.faculty_information_id = ?', [facultyId]);
    console.log(rows);
    return rows;
  } finally {
    if (connection) connection.release();
  }
}

// READ: get Highlight by form id
async function getHighlightByFormId(formId){
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.query(`SELECT * FROM highlights WHERE form_id = ?`);
    console.log(result);
    return result;
  } finally {
    if (connection) connection.release();
  }
}

// CREATE
async function addHighlight({
  form_id,
  student_support_id = null,
  collaborations_section = null,
  professional_development = null,
  significant_outcomes = null
}) {
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.query(
      `INSERT INTO highlights
       (form_id, student_support_id, collaborations_section, professional_development, significant_outcomes)
       VALUES (?, ?, ?, ?, ?) RETURNING id`,
      [form_id, student_support_id, collaborations_section, professional_development, significant_outcomes]
    );
    return result; // contains just the id of the inserted form.
  } finally {
    if (connection) connection.release();
  }
}

// UPDATE (simple, updates only provided fields)
async function updateHighlight(id, data = {}) {
  let connection;
  try {
    connection = await pool.getConnection();

    const allowed = [ //Only these fields can be updated
      'faculty_information_id',
      'supervisor_id',
      'student_support_id',
      'collaborations_section',
      'professional_development'
    ];
    const set = [];
    const params = [];

    for (const key of allowed) {
      if (data[key] !== undefined) {
        set.push(`${key} = ?`);
        params.push(data[key]);
      }
    }

    if (set.length === 0) return { affectedRows: 0 }; //change 0 to number?

    params.push(id);
    return await connection.query(
      `UPDATE highlights SET ${set.join(', ')} WHERE id = ?`,
      params
    );
  } finally {
    if (connection) connection.release();
  }
}

// DELETE
async function deleteHighlight(id) {
  let connection;
  try {
    connection = await pool.getConnection();
    return await connection.query('DELETE FROM highlights WHERE id = ?', [id]);
  } finally {
    if (connection) connection.release();
  }
}

// SUBMISSION
// This is the function that handles the logic for the highlights form submission
// It converts the data into the expected format for the database as well as performs the creation of
// the dynamic elements of the form (ie. services, publications, etc.)
async function submitHighlightsForm(formData){

  // Add record for student support
  const result = await student_support_api.addStudentSupport(formData.student_support);
  const student_support_id = result.id;
  console.log(result);
  
  formData.student_support_id = student_support_id;
  formData.type = "Highlights";
  console.log(student_support_id);

  // Create Form Record
  const form_response = await createForm(formData);
  const form_id = form_response[0].id;
  formData.form_id = form_id;

  // Create Highlights Form Record
  const highlights_response = await addHighlight(formData);
  console.log("Succesfully Created Form");

  // Create Course Sections Records and assign course sections
  for(let course_section of formData.course_sections){
    course_section.form_id = form_id;
    course_section.days_of_the_week = course_sections_api.getDaysOfTheWeek(course_section.days_of_the_week);
    course_section.course_id = course_section.course.value;
    course_section.year = course_section.year.match(/^\d{4}/)[0]; //Extracts the year from the timestamp object
    const res = await course_sections_api.createCourseSection(course_section);
    const course_section_id = res[0].id;
    // Adds Course Section to Form Relationship Table
    forms_to_dynamics_api.assignCourseSectionToForm(form_id, course_section_id);
  }

  console.log("Successfully Added Course Sections")

  // Create Services Records
  for(let service of formData.services){
    service.form_id = form_id;
    const res = await services_api.createService(service);
    const service_id = res[0].id;
    // Adds Service to Form Relationship Table
    forms_to_dynamics_api.assignServiceToForm(form_id, service_id);
  }

  console.log("Successfully Added Services")

  // Create Grants Records
  for(let grant of formData.grants){
    grant.form_id = form_id;
    const res = await grants_api.addGrant(grant);
    const grant_id = res[0].id;
    // Adds Grant to Form Relationship Table
    forms_to_dynamics_api.assignGrantToForm(form_id, grant_id);
  }

  console.log("Successfully Added Grants")
  
  // Create Publications Records
  for(let publication of formData.publications){
    publication.form_id = form_id;
    publication.date_published = publication.date_published.match(/^\d{4}-\d{2}-\d{2}/)[0];
    const res = await publications_api.createPublication(publication);
    const publication_id = res[0].id;
    // Adds Publication to Form Relationship Table
    forms_to_dynamics_api.assignPublicationToForm(form_id, publication_id);
  }
  
  console.log("Successfully Added Publications")

  return;
}

// Reset
async function resetHighlightsTable(){
    let connection;
    try {
        // Read sql file that rebuilds highlights table and inserts test data
        const resetQuery = await fs.readFileSync("sql/highlights.sql", 'utf-8');
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
  getAllHighlights,
  getHighlightById,
  addHighlight,
  updateHighlight,
  deleteHighlight,
  submitHighlightsForm,
  getHighlightByFacultyId,
  resetHighlightsTable,
  getHighlightByFormId
};

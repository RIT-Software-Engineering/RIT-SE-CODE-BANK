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
    return await connection.query(
      'SELECT forms.id, forms.time_submitted FROM forms INNER JOIN highlights ON forms.id = highlights.form_id WHERE forms.faculty_information_id = ?', 
      [facultyId]
    );
  } finally {
    if (connection) connection.release();
  }
}

// READ: get Highlight by form id
async function getHighlightByFormId(formId){
  let connection;
  try {
    connection = await pool.getConnection();
    return await connection.query('SELECT * FROM highlights WHERE form_id = ?', [formId]);
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

// SUBMISSION: Handle highlights form submission with all related data
async function submitHighlightsForm(formData){
  // Create student support record
  const result = await student_support_api.addStudentSupport(formData.student_support);
  const student_support_id = result[0].id;
  
  // Create form record with PDF data
  const pdfBuffer = formData.pdf_data ? Buffer.from(formData.pdf_data, 'base64') : null;
  const form_response = await createForm({
    faculty_information_id: formData.faculty_information_id,
    isSubmission: formData.isSubmission,
    pdf_data: pdfBuffer
  });
  const form_id = form_response[0].id;

  // Create highlights record
  await addHighlight({
    form_id,
    student_support_id,
    collaborations_section: formData.collaborations_section,
    professional_development: formData.professional_development,
    significant_outcomes: formData.significant_outcomes
  });

  // Add course sections
  for(const course_section of formData.course_sections){
    course_section.days_of_the_week = course_sections_api.getDaysOfTheWeek(course_section.days_of_the_week);
    course_section.course_id = course_section.course.value;
    course_section.year = course_section.year.match(/^\d{4}/)[0];
    const res = await course_sections_api.createCourseSection(course_section);
    await forms_to_dynamics_api.assignCourseSectionToForm(form_id, res[0].id);
  }

  // Add services
  for(const service of formData.services){
    const res = await services_api.createService(service);
    await forms_to_dynamics_api.assignServiceToForm(form_id, res[0].id);
  }

  // Add grants
  for(const grant of formData.grants){
    const res = await grants_api.addGrant(grant);
    await forms_to_dynamics_api.assignGrantToForm(form_id, res[0].grant_id);
  }
  
  // Add publications
  for(const publication of formData.publications){
    publication.date_published = publication.date_published.match(/^\d{4}-\d{2}-\d{2}/)[0];
    const res = await publications_api.createPublication(publication);
    await forms_to_dynamics_api.assignPublicationToForm(form_id, res[0].id);
  }
}

// Reset highlights table
async function resetHighlightsTable(){
    let connection;
    try {
        const resetQuery = fs.readFileSync("sql/highlights.sql", 'utf-8');
        const queries = resetQuery.split(';').filter(q => q.trim());

        connection = await pool.getConnection();
        for (const query of queries){
            await connection.query(query);
        }
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

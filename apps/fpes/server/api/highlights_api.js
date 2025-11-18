const pool = require('../db');

const student_support_api = require('./student_support_api');
const course_sections_api = require('./course_section_api');
const services_api = require('./service_api');
const publications_api = require('./publications_api');
const grants_api = require('./grants_api');

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

// CREATE
async function addHighlight({
  faculty_information_id,
  supervisor_id = null,
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
       (faculty_information_id, supervisor_id, student_support_id, collaborations_section, professional_development, significant_outcomes)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
      [faculty_information_id, supervisor_id, student_support_id, collaborations_section, professional_development, significant_outcomes]
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
  console.log(formData)

  // Add record for student support
  if(formData.student_support.length > 0){
  const result = await student_support_api.addStudentSupport(formData.student_support[0]);
  const student_support_id = result.id;
  console.log(formData.student_support[0]);
  formData.student_support_id = student_support_id;
  }

  // Create Highlights Form Record
  const highlights_response = await addHighlight(formData);
  const form_id = highlights_response[0].id;
  console.log("Succesfully Created Form");

  // Create Course Sections Records
  for(let course_section of formData.course_sections){
    course_section.form_id = form_id;
    course_section.days_of_the_week = course_sections_api.getDaysOfTheWeek(course_section.days_of_the_week);
    course_section.course_id = course_section.course.value;
    course_section.year = course_section.year.match(/^\d{4}/)[0]; //Extracts the year from the timestamp object
    course_sections_api.createCourseSection(course_section);
  }

  console.log("Successfully Added Course Sections")

  // Create Services Records
  for(let service of formData.services){
    service.form_id = form_id;
    await services_api.createService(service);
  }

  console.log("Successfully Added Services")

  // Create Grants Records
  for(let grant of formData.grants){
    grant.form_id = form_id;
    await grants_api.addGrant(grant);
  }

  console.log("Successfully Added Grants")
  
  // Create Publications Records
  for(let publication of formData.publications){
    publication.form_id = form_id;
    publication.date_published = publication.date_published.match(/^\d{4}-\d{2}-\d{2}/)[0];
    await publications_api.createPublication(publication);
  }
  
  console.log("Successfully Added Publications")

  return;
}

module.exports = {
  getAllHighlights,
  getHighlightById,
  addHighlight,
  updateHighlight,
  deleteHighlight,
  submitHighlightsForm,
};

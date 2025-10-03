const pool = require('../db');

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
  professional_development = null
}) {
  let connection;
  try {
    connection = await pool.getConnection();
    const result = await connection.query(
      `INSERT INTO highlights
       (faculty_information_id, supervisor_id, student_support_id, collaborations_section, professional_development)
       VALUES (?, ?, ?, ?, ?)`,
      [faculty_information_id, supervisor_id, student_support_id, collaborations_section, professional_development]
    );
    return result; // contains insertId, affectedRows, etc.
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

module.exports = {
  getAllHighlights,
  getHighlightById,
  addHighlight,
  updateHighlight,
  deleteHighlight,
};

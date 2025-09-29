const pool = require('../db');
require('dotenv').config();

// READ: all
async function getAllCourses() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM courses');
    return rows;
  } finally {
    if (conn) conn.release();
  }
}

// READ: by id
async function getCourseById(id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM courses WHERE id = ?', [id]);
    return rows[0] || null;
  } finally {
    if (conn) conn.release();
  }
}

// CREATE
async function addCourse({ course_code, course_name, credits, department_id }) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      `INSERT INTO courses (course_code, course_name, credits, department_id)
       VALUES (?, ?, ?, ?)`,
      [course_code, course_name, credits, department_id]
    );
    return { id: result.insertId };
  } finally {
    if (conn) conn.release();
  }
}

// UPDATE (partial)
async function updateCourse(id, data = {}) {
  const allowed = ['course_code', 'course_name', 'credits', 'department_id'];
  const sets = [];
  const params = [];

  for (const key of allowed) {
    if (data[key] !== undefined) {
      sets.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (sets.length === 0) return { changedRows: 0 };

  let conn;
  try {
    conn = await pool.getConnection();
    params.push(id);
    const result = await conn.query(
      `UPDATE courses SET ${sets.join(', ')} WHERE id = ?`,
      params
    );
    return { changedRows: result.affectedRows };
  } finally {
    if (conn) conn.release();
  }
}

// DELETE
async function deleteCourse(id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query('DELETE FROM courses WHERE id = ?', [id]);
    return { deleted: result.affectedRows > 0 };
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  getAllCourses,
  getCourseById,
  addCourse,
  updateCourse,
  deleteCourse,
};

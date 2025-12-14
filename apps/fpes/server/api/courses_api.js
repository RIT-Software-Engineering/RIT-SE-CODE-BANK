const pool = require('../db');
const fs = require('fs')

// READ: all
async function getAllCourses() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT CAST(id AS CHAR) AS id, course_code, course_name, credits, department_id FROM courses'
    );
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
    const rows = await conn.query(
      'SELECT CAST(id AS CHAR) AS id, course_code, course_name, credits, department_id FROM courses WHERE id = ?',
      [id]
    );
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
      [
        course_code,
        course_name,
        Number(credits),            // <-- ensure number
        department_id ?? null       // <-- allow null if not provided
      ]
    );
    return { id: String(result.insertId) }; // <-- avoid BigInt JSON issue
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
      let val = data[key];

      if (key === 'credits' && val !== null) {
        val = Number(val);          // <-- normalize to number
      }
      if (key === 'department_id' && (val === '' || val === undefined)) {
        val = null;                 // <-- empty => null
      }

      sets.push(`${key} = ?`);
      params.push(val);
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

// Reset
async function resetCoursesTable(){
    let connection;
    try {
        // Read sql file that rebuilds courses table and inserts test data
        const resetQuery = await fs.readFileSync("sql/courses.sql", 'utf-8');
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
  getAllCourses,
  getCourseById,
  addCourse,
  updateCourse,
  deleteCourse,
  resetCoursesTable
};

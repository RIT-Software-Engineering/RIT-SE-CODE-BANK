const pool = require('../db');
const mariadb = require('mariadb');
require('dotenv').config();


async function getAllStudentSupport() { //Read
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query("SELECT * FROM student_support");
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  getAllStudentSupport,
  getStudentSupportById,
  addStudentSupport,
  updateStudentSupport,
  deleteStudentSupport
};
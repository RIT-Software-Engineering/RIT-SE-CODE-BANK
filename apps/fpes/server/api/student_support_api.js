const pool = require('../db');
const mariadb = require('mariadb');
require('dotenv').config();


async function getAllStudentSupport(conn) { //Read
  let conn;
  try {
    conn = await pool.getConnection();
    return await conn.query("SELECT * FROM student_support");
  } finally {
    if (conn) conn.release();
  }
}

async function getStudentSupportById(id) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query("SELECT * FROM student_support WHERE id = ?", [id]);
    return rows.length ? rows[0] : null;
  } finally {
    if (conn) conn.release();
  }
}

async function addStudentSupport(studentSupportData) {  //Create
  let conn;
  try {
    conn = await pool.getConnection();
        const { independent_studies_supervised,
        bs_cs_students_supervised,
        ms_defence_chair,
        ms_defence_member,
        active_ms_cs_as_chair,
        other_bs_projects,
        other_ms_projects,
        current_phd_advisees,
        phd_passed_rpa_as_chair,
        phd_passed_pro_as_chair,
        phd_passed_def_as_chair,
        phd_rpa_def_pro_as_member } = studentSupportData
    const result = await conn.query(
      `INSERT INTO student_support 
       (independent_studies_supervised, bs_cs_students_supervised, ms_defence_chair, ms_defence_member,
        active_ms_cs_as_chair, other_bs_projects, other_ms_projects, current_phd_advisees,
        phd_passed_rpa_as_chair, phd_passed_pro_as_chair, phd_passed_def_as_chair, phd_rpa_def_pro_as_member)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        independent_studies_supervised,
        bs_cs_students_supervised,
        ms_defence_chair,
        ms_defence_member,
        active_ms_cs_as_chair,
        other_bs_projects,
        other_ms_projects,
        current_phd_advisees,
        phd_passed_rpa_as_chair,
        phd_passed_pro_as_chair,
        phd_passed_def_as_chair,
        phd_rpa_def_pro_as_member
      ]
    );

    return { id: result.insertId };
  } finally {
    if (conn) conn.release();
  }
}





module.exports = {
  getAllStudentSupport,
  getStudentSupportById,
  addStudentSupport,
  //updateStudentSupport,
  //deleteStudentSupport
};
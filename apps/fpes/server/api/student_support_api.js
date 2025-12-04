const pool = require('../db');
const mariadb = require('mariadb');
const fs = require('fs')


async function getAllStudentSupport() { //Read
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
        const results = { independent_studies_supervised,
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
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?) RETURNING id`,
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

async function updateStudentSupport(id, studentSupportData) { //Update
  try {
    conn = await pool.getConnection();
        const results = { independent_studies_supervised,
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
      `UPDATE student_support SET
        independent_studies_supervised = ?, bs_cs_students_supervised = ?, ms_defence_chair = ?, ms_defence_member = ?,
        active_ms_cs_as_chair = ?, other_bs_projects = ?, other_ms_projects = ?, current_phd_advisees = ?,
        phd_passed_rpa_as_chair = ?, phd_passed_pro_as_chair = ?, phd_passed_def_as_chair = ?, phd_rpa_def_pro_as_member = ?
       WHERE id = ?`,
      [
        data.independent_studies_supervised,
        data.bs_cs_students_supervised,
        data.ms_defence_chair,
        data.ms_defence_member,
        data.active_ms_cs_as_chair,
        data.other_bs_projects,
        data.other_ms_projects,
        data.current_phd_advisees,
        data.phd_passed_rpa_as_chair,
        data.phd_passed_pro_as_chair,
        data.phd_passed_def_as_chair,
        data.phd_rpa_def_pro_as_member,
        id
      ]
    );
    return result.affectedRows > 0;
  } finally {
    if (conn) conn.release();
  }
}

async function deleteStudentSupport(id) { //Delete
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query("DELETE FROM student_support WHERE id = ?", [id]);
    return result.affectedRows > 0;
  } finally {
    if (conn) conn.release();
  }
}

async function resetStudentSupportTable(){
    let connection;
    try {
        // Read sql file that rebuilds student support table and inserts test data
        const resetQuery = await fs.readFileSync("sql/student_support.sql", 'utf-8');
        // Splits file into multiple queries
        let queries = resetQuery.split(';');
        // Removes the empty query at the end
        queries.pop();

        connection = await pool.getConnection();
        let results = [];
        for (const query of queries){
            results.push(await connection.query(query));
        }

        return results;
    } finally {
        if (connection) connection.release();
    } 
}

module.exports = {
  getAllStudentSupport,
  getStudentSupportById,
  addStudentSupport,
  updateStudentSupport,
  deleteStudentSupport,
  resetStudentSupportTable
};
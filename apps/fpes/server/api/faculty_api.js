const pool = require('../db');
const mariadb = require('mariadb');
require('dotenv').config();
const fs = require('fs');

// READ: all
async function getAllFaculty() {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query('SELECT * FROM faculty_information');
    return rows;
  } finally {
    if (conn) conn.release();
  }
}

// READ: by id
async function getFacultyById(facultyId) {
  let conn;
  try {
    conn = await pool.getConnection();
    const rows = await conn.query(
      'SELECT * FROM faculty_information WHERE faculty_id = ?',
      [facultyId]
    );
    return rows[0] || null;
  } finally {
    if (conn) conn.release();
  }
}

// READ : get the faculty members a supervisor supervises
async function getAllFacultyOfSupervisor(supervisor_id){
  let connection;
  try {
    connection = await pool.getConnection();
    const result = connection.query(
      `SELECT * FROM faculty_information
      WHERE supervisor_id = ?
      `,
      [supervisor_id]
    )
    return result;
  } finally {
    if (connection) connection.release();
  }
}

// READ : gets the record of a faculty members supervisor
async function getSupervisorOfFacultyMember(facultyId){
  let connection;
  try {
    connection = await pool.getConnection();
    const result = connection.query(
      `SELECT T2.* FROM T1 AS faculty_information 
      INNER JOIN T2 as faculty_information
      WHERE 
      T1.faculty_id = ? AND
      T1.supervisor_id = T2.faculty_id`,
      [facultyId]
    );
    return result;
  } finally {
    if (connection) connection.release();
  }
}

// READ : get all faculty with supervisor role
async function getAllSupervisors(){
  let connection;
  try {
    connection = await pool.getConnection();
    const result = connection.query(
      `SELECT * FROM faculty_information
      WHERE FIND_IN_SET('Supervisor', user_role)
      `
    );
    return result;
  } finally {
    if (connection) connection.release();
  }
  
}

// CREATE
async function addFaculty({ name, rank, unit, affiliations = null, user_role }) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      `INSERT INTO faculty_information (name, rank, unit, affiliations, user_role)
       VALUES (?, ?, ?, ?, ?)`,
      [name, rank, unit, affiliations, user_role]
    );
    return { faculty_id: result.insertId };
  } finally {
    if (conn) conn.release();
  }
}

// UPDATE (partial)
async function updateFaculty(facultyId, data = {}) {
  const allowed = ['name', 'rank', 'unit', 'affiliations', 'user_role'];
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
    params.push(facultyId);
    const result = await conn.query(
      `UPDATE faculty_information SET ${sets.join(', ')} WHERE faculty_id = ?`,
      params
    );
    return { changedRows: result.affectedRows };
  } finally {
    if (conn) conn.release();
  }
}

// UPDATE : assign faculty member a supervisor
async function assignSupervisorToFaculty(facultyId, supervisorId){
  let connection;
  try {
    connection = await pool.getConnection();
    const results = connection.query(
      `UPDATE faculty_information SET supervisor_id = ? WHERE faculty_id = ?`,
      [supervisorId, facultyId]
    )
    console.log("Supervisor assigned successfully")
    return results;
  } finally {
    if (connection) connection.release();
  }
}

// UPDATE : remove a faculty member's supervisor
async function removeSupervisor(facultyId){
  let connection;
  try {
    connection = await pool.getConnection();
    const results = connection.query(
      `UPDATE faculty_information SET supervisor_id = NULL WHERE faculty_id = ?`,
      [facultyId]
    )
    console.log("SUpervisor removed successfully");
    return results;
  } finally {
    if (connection) connection.release();
  }
}

// DELETE
async function deleteFaculty(facultyId) {
  let conn;
  try {
    conn = await pool.getConnection();
    const result = await conn.query(
      'DELETE FROM faculty_information WHERE faculty_id = ?',
      [facultyId]
    );
    return { deleted: result.affectedRows > 0 };
  } finally {
    if (conn) conn.release();
  }
}

// Reset
async function resetFacultyTable(){
    let connection;
    try {
        // Read sql file that rebuilds faculty_information table and inserts test data
        const resetQuery = await fs.readFileSync("sql/faculty_information.sql", 'utf-8');
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
  getAllFaculty,
  getFacultyById,
  addFaculty,
  updateFaculty,
  deleteFaculty,
  resetFacultyTable,
  assignSupervisorToFaculty,
  removeSupervisor,
  getSupervisorOfFacultyMember,
  getAllFacultyOfSupervisor,
  getAllSupervisors
};

const pool = require('../db')
const mariadb = require('mariadb');
require('dotenv').config();
const fs = require('fs')



async function getAllGrants(connection){ //Read
    const results = await connection.query("SELECT * FROM grants");
    return results;
}

async function getGrantsById(id){
    conn = await pool.getConnection();
    const results = await connection.query("SELECT * FROM service WHERE id = ?", [id]);
    if (connection) connection.release();
    return results;
}

async function getGrantsByFormId(form_id){
    conn = await pool.getConnection();
    const results = await connection.query("SELECT * FROM service WHERE form_id = ?", [form_id]);
    if (connection) connection.release();
    return results;
}

async function addGrant(grantData){ //Post
  try {
    conn = await pool.getConnection();
    const { title, funder, amount, time_period, faculty_role, faculty_share, comments, grant_status } = req.body;
    const result = await conn.query(
      `INSERT INTO grants (form_id, title, funder, amount, time_period, faculty_role, faculty_share, comments, grant_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, funder, amount, time_period, faculty_role, faculty_share, comments, grant_status]
    );
    return { grant_id: result.insertId };
  } finally {
    if (conn) conn.release();
  }
}

//Update

//Delete

module.exports = {
    getAllGrants: getAllGrants,
    getGrantsById : getGrantsById,
    getGrantsByFormId : getGrantsByFormId,
    addGrant : addGrant
}
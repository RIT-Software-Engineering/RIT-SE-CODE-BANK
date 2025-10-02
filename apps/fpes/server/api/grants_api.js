const pool = require('../db')
const mariadb = require('mariadb');
const fs = require('fs')



async function getAllGrants(){ //Read
  let connection
  try {
    connection = await pool.getConnection();
    const results = await connection.query("SELECT * FROM grants");
    return results;
  }
  finally {
    if (connection) connection.release();
  }
}

async function getGrantsById(id){
    let connection;
    try {
      connection = await pool.getConnection();
      const results = await connection.query("SELECT * FROM service WHERE id = ?", [id]);
      return results;
    }
    finally {
      if (connection) connection.release();
    }

}

async function getGrantsByFormId(form_id){
    let connection;
    try {
      conn = await pool.getConnection();
      const results = await connection.query("SELECT * FROM service WHERE form_id = ?", [form_id]);
      return results;
    }
    finally {
      if (connection) connection.release();
    }
}

async function addGrant(grantData){ //Create
  try {
    conn = await pool.getConnection();
    const { title, funder, amount, time_period, faculty_role, faculty_share, comments, grant_status } = grantData;
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
async function updateGrant(id, grantData) {
  try {
    conn = await pool.getConnection();
    const { title, funder, amount, time_period, faculty_role, faculty_share, comments, grant_status } = grantData;
    const result = await conn.query(
      `UPDATE grants 
       SET title = ?, funder = ?, amount = ?, time_period = ?, faculty_role = ?, faculty_share = ?, comments = ?, grant_status = ?
       WHERE grant_id = ?`,
      [title, funder, amount, time_period, faculty_role, faculty_share, comments, grant_status]
    );
    return result.affectedRows > 0;
  } finally {
    if (conn) conn.release();
  }
}


//Delete
async function deleteGrant(id) {
  try {
    conn = await pool.getConnection();
    const result = await conn.query("DELETE FROM grants WHERE grant_id = ?", [id]);
    return result.affectedRows > 0;
  } finally {
    if (conn) conn.release();
  }
}



module.exports = {
    getAllGrants,
    getGrantsById,
    getGrantsByFormId,
    addGrant,
    updateGrant,
    deleteGrant
}
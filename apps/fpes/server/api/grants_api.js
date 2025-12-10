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
      const results = await connection.query("SELECT * FROM grants WHERE id = ?", [id]);
      return results;
    }
    finally {
      if (connection) connection.release();
    }

}

async function addGrant(grantData){ //Create
  try {
    conn = await pool.getConnection();
    const { title, amount, funder, start_date, end_date, faculty_role, faculty_share, comments, grant_status } = grantData;
    const result = await conn.query(
      `INSERT INTO grants (title, funder, amount, start_date, end_date, faculty_role, faculty_share, comments, grant_status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [title, funder, amount, start_date, end_date, faculty_role, faculty_share, comments, grant_status]
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
    const { title, funder, amount, start_date,  end_date, faculty_role, faculty_share, comments, grant_status } = grantData;
    const result = await conn.query(
      `UPDATE grants 
       SET title = ?, funder = ?, amount = ?, start_date = ?, end_date, faculty_role = ?, faculty_share = ?, comments = ?, grant_status = ?
       WHERE grant_id = ?`,
      [title, funder, amount, start_date, end_date, faculty_role, faculty_share, comments, grant_status, id]
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

// Reset
async function resetGrantsTable(){
    let connection;
    try {
        // Read sql file that rebuilds grants table and inserts test data
        const resetQuery = await fs.readFileSync("sql/grants.sql", 'utf-8');
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
    getAllGrants,
    getGrantsById,
    addGrant,
    updateGrant,
    deleteGrant,
    resetGrantsTable
}
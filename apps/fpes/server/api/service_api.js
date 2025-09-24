const pool = require('../db')
const fs = require('fs')

async function getAllServices(){
    connection = await pool.getConnection();
    const results = await connection.query("SELECT * FROM service");
    if (connection) connection.release();
    return results; 
}

async function getServiceById(id){
    connection = await pool.getConnection();
    const results = await connection.query("SELECT * FROM service WHERE id = ?", [id]);
    if (connection) connection.release();
    return results;
}

async function getServicesByFormId(form_id){
    connection = await pool.getConnection();
    const results = await connection.query("SELECT * FROM service WHERE form_id = ?", [form_id]);
    if (connection) connection.release();
    return results;
}

async function resetServiceTable(){
    const resetQuery = await fs.readFileSync("sql/services.sql", 'utf-8');

    let queries = resetQuery.split(';');
    queries.pop();
    connection = await pool.getConnection();
    let results = [];
    for (const query of queries){
        results += await connection.query(query);
    }
    
    if (connection) connection.release();
    return results;
}


module.exports = {
    getAllServices: getAllServices,
    getServiceById: getServiceById,
    getServicesByFormId: getServicesByFormId,
    resetServiceTable, resetServiceTable
}
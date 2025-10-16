const pool = require('../db')
const fs = require('fs')

async function getAllServices(){
    let connection;
    try {
        // Get connection from pool and query db
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM services");
        return results; 
    } finally {
        if (connection) connection.release();
    } 
}

async function getServiceById(id){
    let connection;
    try {
        // Get connection from pool and query db
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM services WHERE id = ?", [id]);
        return results;
    } finally {
        // Always makes sure to release connection in case of error
        if (connection) connection.release();
    }
}

async function deleteService(id){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("DELETE FROM services WHERE id = ?", [id])
        return results
    } finally {
        if (connection) connection.release();
    }
}

async function getServicesByFormId(form_id){
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM services WHERE form_id = ?", [form_id]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function resetServiceTable(){
    let connection;
    try {
        // Read sql file that rebuilds services table and inserts test data
        const resetQuery = await fs.readFileSync("sql/services.sql", 'utf-8');
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

async function createService(body){
    let connection;
    try {
        // Get Connection from Pool
        connection = await pool.getConnection();
        const { form_id, service_type, title, hours_worked, other_contributions} = body;

        const results = await connection.query(
            `INSERT INTO services (form_id, service_type, title, hours_worked, other_contributions) 
            VALUES (?, ?, ?, ?, ?) RETURNING id`,
            [form_id, service_type, title, hours_worked, other_contributions]
        );
        
        return results
    } finally {
        if (connection) connection.release();
    }
}

async function updateService(id, body){
    try {
        // Get Connection from Pool
        connection = await pool.getConnection();
        const allowed = ["form_id", "service_type", "title", "hours_worked", "other_contributions"];
        sets = []
        params = []

        for (const key of allowed) {
            if (key in body) {
            sets.push(`${key} = ?`);
            params.push(body[key]);
            }
        }
        if (sets.length === 0) return { changedRows: 0 };
        params.push(id)

        const results = await connection.query(
            `UPDATE services SET 
            ${sets.join(", ")}
            WHERE id = ?`,
            params
        );
        
        return {changedRows : results.changedRows};
    } finally {
        if (connection) connection.release();
    }
}




module.exports = {
    getAllServices,
    getServiceById,
    getServicesByFormId,
    resetServiceTable,
    createService,
    deleteService,
    updateService
}
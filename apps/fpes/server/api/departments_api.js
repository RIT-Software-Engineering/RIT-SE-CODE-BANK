const pool = require('../db')
const fs = require('fs')

async function getAllDepartments() {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = /*await*/ connection.query("SELECT * FROM departments");
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function getDepartmentByID(id) {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query("SELECT * FROM departments WHERE id = ?", [id]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function createDepartment(body) {
    let connection;
    try {
        connection = await pool.getConnection();
        const {department_name, college} = body;
        const results = connection.query(
            `INSERT INTO departments (department_name, college)
             VALUES (?,?) RETURNING id`, [department_name, college]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function updateDepartment(id, body) {
    let connection;
    try {
        connection = await pool.getConnection();

        allowed = ["department_name", "college"]
        sets = []
        params = []

        for (const key of allowed) {
            if (key in body) {
            sets.push(`${key} = ?`);
            params.push(body[key]);
            }
        }
        if (sets.length === 0) return { affectedRows: 0 };
        params.push(id)

        const results = await connection.query(
            `UPDATE departments SET 
            ${sets.join(", ")}
            WHERE id = ?`,
            params
        );

        return {affectedRows : results.affectedRows}
    } finally {
        if (connection) connection.release();
    }
}

async function deleteDepartment(id) {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("DELETE FROM departments WHERE id = ?", [id])
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function resetDepartmentsTable(){
    let connection;
    try {
        // Read sql file that rebuilds departments table and inserts test data
        const resetQuery = fs.readFileSync("sql/departments.sql", 'utf-8');
        // Splits file into multiple queries
        let queries = resetQuery.split(';');
        // Removes the empty query at the end
        queries.pop();

        connection = await pool.getConnection();
        let results = [];
        for (const query of queries){
            results += await connection.query(query); //results.push(await connection.query(query));
        }

        return results;
    } finally {
        if (connection) connection.release();
    } 
}



module.exports = {
    getAllDepartments,
    getDepartmentByID,
    createDepartment,
    updateDepartment,
    deleteDepartment,
    resetDepartmentsTable
}
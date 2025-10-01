const pool = require('../db')

async function getAllDepartments() {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query("SELECT * FROM departments");
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
             VALUES (?,?)`, [department_name, college]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function updateDepartment(id, body) {
    let connection;
    try {
        connection = await pool.getConnection();
        const {department_name, college} = body;
        const results = connection.query(
            `UPDATE departments SET department_name = ?, college = ?
            WHERE id = ?`, [department_name, college, id]);
        return results;
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





module.exports = {
    getAllDepartments,
    getDepartmentByID,
    createDepartment,
    updateDepartment,
    deleteDepartment
}
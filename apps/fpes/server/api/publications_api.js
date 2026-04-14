const pool = require("../db");
const fs = require('fs')

async function getAllPublications() {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM publications");
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function getPublicationByTitle(title) {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM publications WHERE title = ?", [title]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function createPublication(body) {
    let connection;
    try {
        connection = await pool.getConnection();
        const {title, type, authors} = body;
        const results = await connection.query(
            `INSERT INTO publications (title, type, authors)
             VALUES (?,?,?) RETURNING id`, [title, type, authors]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function updatePublication(title, body) {
    let connection;
    try {
        connection = await pool.getConnection();
        const allowed = ["title", "type", "authors"];
        sets = []
        params = []

        for (const key of allowed) {
            if (key in body) {
            sets.push(`${key} = ?`);
            params.push(body[key]);
            }
        }
        if (sets.length === 0) return { changedRows: 0 };
        params.push(title)

        const results = await connection.query(
            `UPDATE publications SET 
            ${sets.join(", ")}
            WHERE title = ?`,
            params
        );
        return {changedRows : results.changedRows};
    } finally {
        if (connection) connection.release();
    }
}

async function deletePublication(title) {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("DELETE FROM publications WHERE title = ?", [title])
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function resetPublicationsTable(){
    let connection;
    try {
        // Read sql file that rebuilds course_sections table and inserts test data
        const resetQuery = await fs.readFileSync("sql/publications.sql", 'utf-8');
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
    getAllPublications,
    getPublicationByTitle,
    createPublication,
    updatePublication,
    deletePublication,
    resetPublicationsTable
}
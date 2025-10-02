const pool = require("../db");

async function getAllPublications() {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query("SELECT * FROM publications");
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function getPublicationByID(id) {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query("SELECT * FROM publications WHERE id = ?", [id]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function createPublication(body) {
    let connection;
    try {
        connection = await pool.getConnection();
        const {form_id, publication_name, venue, proof_of_significance} = body;
        const results = connection.query(
            `INSERT INTO publications (form_id, publication_name, venue, proof_of_significance)
             VALUES (?,?,?,?)`, [form_id, publication_name, venue, proof_of_significance]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function updatePublication(id, body) {
    let connection;
    try {
        connection = await pool.getConnection();
        const {form_id, publication_name, venue, proof_of_significance} = body;
        const results = connection.query(
            `UPDATE publications SET form_id = ?, publication_name = ?, venue = ?, proof_of_significance = ?
            WHERE id = ?`, [form_id, publication_name, venue, proof_of_significance, id]);
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function deletePublication(id) {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("DELETE FROM publications WHERE id = ?", [id])
        return results;
    } finally {
        if (connection) connection.release();
    }
}

async function initPublicationsTable(){
    let connection;
    try {
        // Read sql file that rebuilds course_sections table and inserts test data
        const resetQuery = await fs.readFileSync("sql/course_sections.sql", 'utf-8');
        // Splits file into multiple queries
        let queries = resetQuery.split(';');
        // Removes the empty query at the end
        queries.pop();

        connection = await pool.getConnection();
        let results = [];
        for (const query of queries){
            results += await connection.query(query);
        }

        return results;
    } finally {
        if (connection) connection.release();
    } 
}

module.exports = {
    getAllPublications,
    getPublicationByID,
    createPublication,
    updatePublication,
    deletePublication,
    initPublicationsTable
}
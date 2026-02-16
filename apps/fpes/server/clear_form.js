const pool = require("./db");

async function clearForms() {
    let connection;
    try {
        connection = await pool.getConnection();

        await connection.query('DELETE FROM highlights');
        await connection.query('DELETE FROM forms');

        console.log("All forms and highlights cleared!");

    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

clearForms().catch(console.error);


//node server/clear_form.js
// This script is for development purposes only. It clears all forms and highlights from the database. Use with caution!
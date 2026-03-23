const pool = require('./db');

async function resetForms() {
    let connection;
    try {
        connection = await pool.getConnection();
        await connection.query('SET FOREIGN_KEY_CHECKS = 0');
        await connection.query('DELETE FROM highlights');
        await connection.query('DELETE FROM forms_grants');
        await connection.query('DELETE FROM forms');
        await connection.query('ALTER TABLE forms AUTO_INCREMENT = 1');
        await connection.query('SET FOREIGN_KEY_CHECKS = 1');
        console.log('Forms table reset successfully');
    } catch (error) {
        console.error('Reset failed:', error);
    } finally {
        if (connection) connection.release();
        process.exit();
    }
}

resetForms();

const pool = require('../db')
const fs = require('fs')


async function resetTeachingEvalsTables(){
    let connection;
    try {
        // Read sql file that rebuilds services table and inserts test data
        const resetQuery = await fs.readFileSync("sql/teaching_eval.sql", 'utf-8');
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

module.exports = {
    resetTeachingEvalsTables,
}
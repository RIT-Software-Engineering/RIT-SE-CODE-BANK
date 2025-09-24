const pool = require('../db')

async function getAllGrants(connection){
    const results = await connection.query("SELECT * FROM grants");
    return results;
}

module.exports = {
    getAllGrants: getAllGrants,
}
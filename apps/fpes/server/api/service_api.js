const pool = require('../db')

async function getAllServices(connection){
    const results = await connection.query("SELECT * FROM service");
    return results;
}


module.exports = {
    getAllServices: getAllServices,
}
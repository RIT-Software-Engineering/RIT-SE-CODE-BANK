const express = require('express');
const app = express();

require('dotenv').config({path: "../.env"});

const mariadb = require('mariadb')

async function createMariaDBConnection(){
    let connection;
    try{
        connection = await mariadb.createConnection({
        host: process.env.HOST,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DATABASE
        });
        console.log("Made Connection...");
    } catch (err) {
        
        console.log("Error connecting to database...")
        console.log(err);
    } finally{
        if (connection){
            return connection;
        }

    }
    
}

async function main() {
    let conn = await createMariaDBConnection();
    let ping = await conn.query("SELECT * FROM service", (err, response) =>{
        if (err) throw err;

        console.log(response);
    })
    await console.log(ping);

    conn.end();
    console.log("Connection closed...")
}

main();








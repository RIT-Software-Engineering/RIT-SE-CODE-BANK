// server/database/setup_db.js

/**
 * This script connects to the MariaDB server using the root credentials.
 * It performs the following actions:
 * 1. Creates the main application database if it doesn't exist.
 * 2. Creates a dedicated application user if it doesn't exist.
 * 3. Grants the necessary privileges to that user for the application database.
 */

const mysql = require('mysql2/promise');

async function initializeDatabase() {
    // --- Configuration from Environment Variables ---
    const config = {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        rootPassword: process.env.DB_ROOT_PASSWORD,
        dbName: process.env.DB_NAME_TAPORTAL,
        appUser: process.env.DB_APP_USER,
        appPassword: process.env.DB_APP_PASSWORD,
    };

    // --- Validate that all required variables are present ---
    const requiredVars = ['host', 'port', 'rootPassword', 'dbName', 'appUser', 'appPassword'];
    for (const v of requiredVars) {
        if (!config[v]) {
            console.error(`FATAL ERROR: Missing required environment variable '${'DB_' + v.toUpperCase()}'. Aborting.`);
            process.exit(1);
        }
    }

    let connection;
    try {
        // --- Establish connection as ROOT to perform admin tasks ---
        console.log(`Connecting to MariaDB as 'root' to begin setup...`);
        connection = await mysql.createConnection({
            host: config.host,
            port: config.port,
            user: 'root',
            password: config.rootPassword
        });
        console.log("Root connection successful.");
        
        // -- Step 1: Drop the existing database if it already exists ---
        console.log(`Dropping database '${config.dbName}' if it already exists...`);
        await connection.query(`DROP DATABASE IF EXISTS \`${config.dbName}\`;`);
        console.log(`Database '${config.dbName}' has been dropped.`);

        // --- Step 2: Create the application database ---
        console.log(`Creating database '${config.dbName}'...`);
        await connection.query(`CREATE DATABASE IF NOT EXISTS \`${config.dbName}\`;`);
        console.log(`Database '${config.dbName}' is ready.`);

        // --- Step 3: Create the dedicated application user ---
        console.log(`Creating user '${config.appUser}'...`);
        await connection.query(`CREATE USER IF NOT EXISTS '${config.appUser}'@'%' IDENTIFIED BY '${config.appPassword}';`);
        console.log(`User '${config.appUser}' is ready.`);

        // --- Step 4: Grant privileges to the new user ---
        console.log(`Granting privileges to '${config.appUser}'...`);
        // We grant privileges on *.* (all databases) to allow Prisma to create
        // its temporary shadow database during development migrations.
        const grantQuery = `GRANT ALL PRIVILEGES ON *.* TO '${config.appUser}'@'%';`;
        await connection.query(grantQuery);
        console.log("Successfully applied global privileges for development.");


        // --- Step 5: Apply the changes ---
        await connection.query('FLUSH PRIVILEGES;');
        console.log("Privileges have been flushed and applied.");

    } catch (error) {
        console.error(`ERROR during database setup:`, error.message);
        process.exit(1);
    } finally {
        if (connection) {
            await connection.end();
            console.log("Root connection closed.");
        }
    }
}

// --- Execute the setup function ---
initializeDatabase();
// server/server/database/setup_db.js

/**
 * =============================================================================
 * !! FOR DEVELOPMENT USE ONLY !!
 *
 * This script provides a set of functions to completely reset and redeploy the
 * development database. It is designed to be run from the command line to
 * ensure a clean slate.
 *
 * The process is as follows:
 * 1. Drops the existing database.
 * 2. Creates a new, empty database.
 * 3. Applies the database schema using Prisma migrations.
 * 4. Populates the database with test data from .sql files.
 *
 * Prerequisites:
 * - A `.env` file with a valid `DATABASE_URL` must be present.
 * - The `mysql` command-line client must be installed and accessible in the system's PATH.
 * =============================================================================
 */

// =============================================================================
// IMPORTS & CONFIGURATION
// =============================================================================

const { exec } = require('child_process');
const util = require('util');
const path = require('path');
const os = require('os');
const fs = require('fs').promises;

// Promisify the `exec` function to use it with async/await.
const execPromise = util.promisify(exec);

// Define the absolute path to the .env file.
const path_to_env = path.resolve(__dirname, '../../.env');

// Load environment variables from the .env file if they aren't already loaded.
if (!process.env.DATABASE_URL) {
    try {
        require('dotenv').config({ path: path_to_env });
    } catch (e) {
        console.error("[DB Redeploy] ERROR: dotenv failed to load:", e.message);
    }
}

// Define the directory where test data SQL files are stored.
const DUMMY_DATA_DIR = path.join(__dirname, 'test_data');

// =============================================================================
// DATABASE HELPER FUNCTIONS
// =============================================================================

/**
 * @desc    Parses the DATABASE_URL environment variable to extract connection details.
 * @param   {string} dbUrl - The database URL from the .env file.
 * @returns {object} An object containing { user, password, host, port, dbName }.
 * @throws  Will throw an error if the URL does not match the expected format.
 */
function parseDatabaseUrl(dbUrl) {
    const matches = dbUrl.match(/mysql:\/\/(.*?):(.*?)@(.*?):(\d+)\/(.*)/);
    if (!matches) {
        throw new Error("Failed to parse DATABASE_URL. Ensure it's in the format: mysql://user:password@host:port/database_name");
    }
    const [, user, password, host, port, dbName] = matches;
    return { user, password, host, port, dbName };
}

/**
 * @desc    Drops the database specified in the DATABASE_URL.
 * @throws  Will throw an error if the operation fails or DATABASE_URL is not set.
 */
async function dropDatabase() {
    console.log("[DB Redeploy] Dropping database...");
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error("DATABASE_URL not found in environment variables.");
    }

    const dbConfig = parseDatabaseUrl(dbUrl);
    const sqlStatement = `DROP DATABASE IF EXISTS \`${dbConfig.dbName}\`;`;

    // Construct the command differently based on the operating system to handle password quoting.
    const dropCommand = os.platform() === 'win32'
        ? `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p"${dbConfig.password}" -e "${sqlStatement}"`
        : `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.password.replace(/'/g, "'\\''")}' -e '${sqlStatement}'`;

    try {
        const { stdout, stderr } = await execPromise(dropCommand);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log(`[DB Redeploy] Database '${dbConfig.dbName}' dropped successfully (if it existed).`);
    } catch (error) {
        console.error("[DB Redeploy] ERROR: Failed to drop database.", error.message);
        throw new Error("Database drop failed.");
    }
}

/**
 * @desc    Creates the database specified in the DATABASE_URL.
 * @throws  Will throw an error if the operation fails or DATABASE_URL is not set.
 */
async function createDatabase() {
    console.log("[DB Redeploy] Creating database...");
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error("DATABASE_URL not found in environment variables.");
    }

    const dbConfig = parseDatabaseUrl(dbUrl);
    const sqlStatement = `CREATE DATABASE IF NOT EXISTS \`${dbConfig.dbName}\`;`;

    // Construct the command differently based on the operating system.
    const createCommand = os.platform() === 'win32'
        ? `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p"${dbConfig.password}" -e "${sqlStatement}"`
        : `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p'${dbConfig.password.replace(/'/g, "'\\''")}' -e '${sqlStatement}'`;

    try {
        const { stdout, stderr } = await execPromise(createCommand);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log(`[DB Redeploy] Database '${dbConfig.dbName}' created successfully.`);
    } catch (error) {
        console.error("[DB Redeploy] ERROR: Failed to create database.", error.message);
        throw new Error("Database creation failed.");
    }
}

/**
 * @desc    Applies the database schema by running `prisma migrate deploy`.
 * This command executes all generated migration files to build the tables.
 * @throws  Will throw an error if the Prisma migration fails.
 */
async function createSchemaFromMigrations() {
    console.log("[DB Redeploy] Applying schema migrations using 'npx prisma migrate deploy'...");
    try {
        const schemaPath = './server/database/prisma/schema.prisma';
        const { stdout, stderr } = await execPromise(`npx prisma migrate deploy --schema ${schemaPath}`);
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        console.log("[DB Redeploy] Database schema applied successfully from migrations.");
    } catch (error) {
        console.error("[DB Redeploy] ERROR: Failed to apply schema migrations.", error.message);
        throw new Error("Prisma migrate deploy failed.");
    }
}

/**
 * @desc    Populates the database with test data by executing all .sql files
 * found in the DUMMY_DATA_DIR.
 * @throws  Will throw an error if any SQL file execution fails.
 */
async function populateDummyData() {
    console.log("[DB Redeploy] Populating test data from SQL files...");
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        throw new Error("DATABASE_URL not found in environment variables.");
    }

    const dbConfig = parseDatabaseUrl(dbUrl);

    try {
        // Read all files from the test data directory.
        const files = await fs.readdir(DUMMY_DATA_DIR);
        // Filter for files that end with .sql.
        const sqlFiles = files.filter(file => file.endsWith('.sql'));

        if (sqlFiles.length === 0) {
            console.warn("[DB Redeploy] No SQL test data files found in", DUMMY_DATA_DIR);
            return;
        }

        // Execute each SQL file sequentially.
        for (const file of sqlFiles) {
            const filePath = path.join(DUMMY_DATA_DIR, file);
            // The command pipes the content of the SQL file into the mysql client.
            const command = `mysql -h ${dbConfig.host} -P ${dbConfig.port} -u ${dbConfig.user} -p"${dbConfig.password}" ${dbConfig.dbName} < "${filePath}"`;

            console.log(`[DB Redeploy] Executing test data file: ${file}...`);
            
            try {
                const { stdout, stderr } = await execPromise(command);
                if (stdout) console.log(stdout);
                if (stderr) console.error(stderr);
            } catch (execError) {
                console.error(`[DB Redeploy] ERROR: Failed to execute SQL from ${file}.`, execError.message);
                throw execError;
            }
        }
        console.log("[DB Redeploy] Test data population complete.");
    } catch (error) {
        console.error("[DB Redeploy] ERROR: Failed to populate test data.", error.message);
        throw new Error("Test data population failed.");
    }
}

// =============================================================================
// MAIN REDEPLOY FUNCTION
// =============================================================================

/**
 * @desc    Executes the full database redeployment sequence. This is the main
 * function intended to be called by a script. It includes a safety
- * check to prevent it from running in a production environment.
 */
async function redeployDatabase() {
  // CRITICAL: Safety check to prevent running this in production.
  if (process.env.NODE_ENV === "production") {
    console.error("[DB Redeploy] ERROR: Attempted to reset database in a production environment. Aborting.");
    process.exit(1);
  }

  try {
    console.log("--- Starting Database Redeploy ---");

    // Execute each step in the required order.
    await dropDatabase();
    await createDatabase();
    await createSchemaFromMigrations();
    await populateDummyData();

    console.log("--- Database Redeploy Complete ---");
  } catch (error) {
    // If any step fails, the script will stop and log the error.
    console.error("[DB Redeploy] A critical error occurred during the redeploy process. Aborting.", error);
    process.exit(1);
  }
}

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = redeployDatabase;

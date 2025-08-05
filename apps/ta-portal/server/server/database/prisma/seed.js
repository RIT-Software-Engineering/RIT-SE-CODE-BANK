// File: apps/ta-portal/server/server/database/prisma/ta-portal/seed.js

const { PrismaClient } = require('@prisma/client');
const { Parser } = require('node-sql-parser');
const fs = require('fs').promises;
const path = require('path');

const prisma = new PrismaClient();
const parser = new Parser();

// --- Configuration ---
// Path to the directory containing your .sql files, relative to this seed script.
const DUMMY_DATA_DIR = path.join(__dirname, '../test_data');
// ---

/**
 * A simple helper to convert a plural SQL table name (e.g., 'users')
 * to a singular, capitalized Prisma model name (e.g., 'User').
 * You may need to adjust this for tables with irregular plurals.
 * @param {string} tableName The table name from the SQL file.
 * @returns {string} The corresponding Prisma model name.
 */
function sqlTableToPrismaModel(tableName) {
    // A common convention: Prisma models are singular, tables are plural.
    // This removes the 's' if it exists.
    const singular = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
    // Prisma models are typically PascalCase.
    return singular.charAt(0).toUpperCase() + singular.slice(1);
}


async function main() {
    console.log('Starting dynamic seeding from .sql files...');

    try {
        const files = await fs.readdir(DUMMY_DATA_DIR);
        // Filter for .sql files and sort them numerically to ensure correct insertion order.
        const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();

        if (sqlFiles.length === 0) {
            console.log('No .sql files found in test_data directory. Seeding complete.');
            return;
        }

        console.log(`Found ${sqlFiles.length} SQL files to process...`);

        // Process each SQL file in order.
        for (const file of sqlFiles) {
            const filePath = path.join(DUMMY_DATA_DIR, file);
            const sqlContent = await fs.readFile(filePath, 'utf-8');

            // Skip empty files
            if (!sqlContent.trim()) {
                console.warn(`Skipping empty file: ${file}`);
                continue;
            }

            // Parse the SQL to get structured data
            const ast = parser.astify(sqlContent);
            
            // The parser returns an array for multiple statements
            const statements = Array.isArray(ast) ? ast : [ast];

            for (const stmt of statements) {
                if (stmt.type === 'insert') {
                    const modelName = sqlTableToPrismaModel(stmt.table[0].table);
                    const prismaModelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);

                    if (!prisma[prismaModelKey]) {
                        console.error(`Error: Prisma model '${prismaModelKey}' not found for table '${stmt.table[0].table}' in file ${file}. Skipping.`);
                        continue;
                    }

                    const columns = stmt.columns;
                    const dataObjects = stmt.values.map(valueSet => {
                        const obj = {};
                        columns.forEach((col, index) => {
                            // Convert SQL values to JS types
                            obj[col] = valueSet.value[index].value;
                        });
                        return obj;
                    });

                    console.log(`Seeding ${dataObjects.length} records into '${modelName}' from ${file}...`);
                    await prisma[prismaModelKey].createMany({
                        data: dataObjects,
                        skipDuplicates: true, // Optional: useful if you run the seed multiple times
                    });
                }
            }
        }

    } catch (error) {
        console.error('An error occurred during seeding:', error);
        process.exit(1);
    }

    console.log('Dynamic seeding finished successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

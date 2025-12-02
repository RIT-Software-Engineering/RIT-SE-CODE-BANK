// File: apps/ta-portal/server/server/database/prisma/ta-portal/seed.js

const os = require('os');
const { PrismaClient } = require('@prisma/client');
const { Parser } = require('node-sql-parser');
const fs = require('fs').promises;
const path = require('path');
const { hashPassword } = require('../../config/passwordHashes');

const prisma = new PrismaClient();

// --- Shared Config ---
const DUMMY_DATA_DIR = path.join(__dirname, '../test_data');

// Helper: Convert SQL table name to Prisma model name
function sqlTableToPrismaModel(tableName) {
    const singular = tableName.endsWith('s') ? tableName.slice(0, -1) : tableName;
    return singular.charAt(0).toUpperCase() + singular.slice(1);
}

// ---------------- Mac/Linux Script ----------------
async function seedMacLinux() {
    const parser = new Parser();
    console.log('[Mac/Linux] Starting dynamic seeding from .sql files...');

    const files = await fs.readdir(DUMMY_DATA_DIR);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();
    if (sqlFiles.length === 0) {
        console.log('No .sql files found. Seeding complete.');
        return;
    }

    for (const file of sqlFiles) {
        const filePath = path.join(DUMMY_DATA_DIR, file);
        const sqlContent = await fs.readFile(filePath, 'utf-8');

        if (!sqlContent.trim()) {
            console.warn(`Skipping empty file: ${file}`);
            continue;
        }

        const ast = parser.astify(sqlContent);
        const statements = Array.isArray(ast) ? ast : [ast];

        for (const stmt of statements) {
            if (stmt.type === 'insert') {
                const modelName = sqlTableToPrismaModel(stmt.table[0].table);
                const prismaModelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);

                if (!prisma[prismaModelKey]) {
                    console.error(`Model '${prismaModelKey}' not found. Skipping.`);
                    continue;
                }

                const columns = stmt.columns;
                let dataObjects = stmt.values.map(valueSet => {
                    const obj = {};
                    columns.forEach((col, index) => {
                        obj[col] = valueSet.value[index].value;
                    });
                    return obj;
                });

                if (modelName === 'User') {
                    dataObjects = await Promise.all(
                        dataObjects.map(async (user) => {
                            if (user.password) {
                                user.password = await hashPassword(user.password);
                            }
                            return user;
                        })
                    );
                }

                console.log(`Seeding ${dataObjects.length} records into '${modelName}'...`);
                await prisma[prismaModelKey].createMany({
                    data: dataObjects,
                    skipDuplicates: true,
                });
            }
        }
    }
}

// ---------------- Windows Script ----------------
async function seedWindows() {
    const parser = new Parser({ database: 'mysql' });
    console.log('[Windows] Starting dynamic seeding from .sql files...');

    const files = await fs.readdir(DUMMY_DATA_DIR);
    const sqlFiles = files.filter(file => file.endsWith('.sql')).sort();
    if (sqlFiles.length === 0) {
        console.log('No .sql files found. Seeding complete.');
        return;
    }

    for (const file of sqlFiles) {
        console.log(`\n---> PROCESSING FILE: ${file}`);
        const filePath = path.join(DUMMY_DATA_DIR, file);
        const sqlContent = await fs.readFile(filePath, 'utf-8');
        const normalizedSql = sqlContent.replace(/\r\n/g, '\n');

        if (!normalizedSql.trim()) {
            console.warn(`Skipping empty file: ${file}`);
            continue;
        }

        const ast = parser.astify(normalizedSql);
        const statements = Array.isArray(ast) ? ast : [ast];

        for (const stmt of statements) {
            if (stmt.type === 'insert') {
                if (!stmt.values) {
                    console.warn(`Skipping INSERT without VALUES in ${file}.`);
                    continue;
                }

                const modelName = sqlTableToPrismaModel(stmt.table[0].table);
                const prismaModelKey = modelName.charAt(0).toLowerCase() + modelName.slice(1);

                if (!prisma[prismaModelKey]) {
                    console.error(`Model '${prismaModelKey}' not found. Skipping.`);
                    continue;
                }

                const values = stmt.values;
                const columns = stmt.columns.map(col => {
                    const cleanCol = col.replace(/`/g, '');
                    return cleanCol === 'maxCAs' ? 'maxTAs' : cleanCol;
                });

                let dataObjects = values.map(valueSet => {
                    const obj = {};
                    if (valueSet && valueSet.value) {
                        columns.forEach((col, index) => {
                            if (valueSet.value[index]) {
                                obj[col] = valueSet.value[index].value;
                            }
                        });
                    }
                    return obj;
                });

                if (modelName === 'User') {
                    dataObjects = await Promise.all(
                        dataObjects.map(async (user) => {
                            if (user.password) {
                                user.password = await hashPassword(user.password);
                            }
                            return user;
                        })
                    );
                }

                try {
                    console.log(`Seeding ${dataObjects.length} records into '${modelName}'...`);
                    await prisma[prismaModelKey].createMany({
                        data: dataObjects,
                        skipDuplicates: true,
                    });
                } catch (e) {
                    console.error(`ERROR seeding into '${modelName}' from '${file}'.`);
                    if (e.name === 'PrismaClientValidationError') {
                        console.error("Validation failed. Data:");
                        console.log(JSON.stringify(dataObjects, null, 2));
                    }
                    throw e;
                }
            }
        }
    }
}

// ---------------- Feature Flags Initialization ----------------
async function initializeFeatureFlags() {
    console.log('\nInitializing feature flags...');
    
    const features = [
        { name: 'MESSAGING', enabled: false },
        { name: 'TIMECARD', enabled: true },
        { name: 'POSITIONS', enabled: true },
        { name: 'APPLICATIONS', enabled: true },
        { name: 'PROFILES', enabled: true },
        { name: 'KRONOS', enabled: true },
        { name: 'ORACLE', enabled: true },
    ];

    for (const feature of features) {
        await prisma.featureFlag.upsert({
            where: { name: feature.name },
            update: {},
            create: feature,
        });
    }
    
    console.log('Feature flags initialized successfully.');
}

// ---------------- Entrypoint ----------------
async function main() {
    try {
        const platform = os.platform();
        if (platform === 'win32') {
            await seedWindows();
        } else {
            await seedMacLinux();
        }
        
        // Initialize feature flags after seeding test data
        await initializeFeatureFlags();
        
        console.log('\nDynamic seeding finished successfully.');
    } catch (error) {
        console.error('Seeding failed:', error.message);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();

// server/server/database/query_db.js

const { PrismaClient } = require('@prisma/client');
const path = require('path');
// Ensure dotenv is loaded for DATABASE_URL if this file is ever run directly or required before main.js
if (!process.env.DATABASE_URL) {
    require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
}

// Initialize Prisma Client
const prisma = new PrismaClient();

/**
 * Retrieves all open positions along with their associated course and course schedule info.
 * @returns {Promise<Array>} A promise that resolves to an array of open positions.
 */
async function getOpenPositionsWithDetails() {
    try {
        const openPositions = await prisma.jobPosition.findMany({
            where: {
                jobPositionStatus: 'OPEN',
            },
            include: {
                course: {
                    select: {
                        name: true,
                        description: true,
                    },
                },
                jobSchedules: {
                    select: {
                        dayOfWeek: true,
                        startTime: true,
                        endTime: true,
                    },
                },
            },
            orderBy: {
                course: {
                    name: 'asc',
                },
            },
        });
        return openPositions;
    } catch (error) {
        console.error("Error retrieving open positions with details:", error);
        throw error;
    }
}


module.exports = {
    getOpenPositionsWithDetails,
};

// Add a process exit handler to disconnect Prisma Client gracefully
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
process.on('SIGTERM', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
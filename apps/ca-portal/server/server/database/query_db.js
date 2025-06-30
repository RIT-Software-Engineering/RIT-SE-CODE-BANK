// server/server/database/query_db.js

const { PrismaClient } = require("@prisma/client");
const path = require("path");
// Ensure dotenv is loaded for DATABASE_URL if this file is ever run directly or required before main.js
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
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
        jobPositionStatus: "OPEN",
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
          name: "asc",
        },
      },
    });
    return openPositions;
  } catch (error) {
    console.error("Error retrieving open positions with details:", error);
    throw error;
  }
}

//temporary function to retireve all users stored in the database
async function getAllUsers() {
  try {
    const users = await prisma.user.findMany();
    return users;
  } catch (error) {
    console.error("Error retrieving users:", error);
    throw error;
  }
}

async function searchOpenPositions(searchTerm) {
  if (!searchTerm || !searchTerm.trim()) {
    return getOpenPositionsWithDetails();
  }

  const courseWhereClause = {
    OR: [
      {
        name: {
          contains: searchTerm,
        },
      },
      {
        courseCode: {
          contains: searchTerm,
        },
      },
    ],
  };

  try {
    const searchResults = await prisma.jobPosition.findMany({
      where: {
        jobPositionStatus: "OPEN",
        course: courseWhereClause,
      },
      include: {
        course: {
          select: {
            name: true,
            description: true,
            courseCode: true,
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
          name: "asc",
        },
      },
    });
    return searchResults;
  } catch (error) {
    console.error(
      `Error searching for open positions with term "${searchTerm}":`,
      error
    );
    throw error;
  }
}

module.exports = {
  getOpenPositionsWithDetails,
  getAllUsers,
  searchOpenPositions,
};

// Add a process exit handler to disconnect Prisma Client gracefully
process.on("beforeExit", async () => {
  await prisma.$disconnect();
});
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

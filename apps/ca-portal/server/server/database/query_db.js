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

//function to retrieve all courses for the onramping feature
async function getAllCourses(){
    try {
        const courses = await prisma.course.findMany({
            select: {
                courseCode: true,
                name: true,
            },
        });
        return courses;
    } catch (error) {
        console.error("Error retrieving courses:", error);
        throw error;
    }
}

async function findUniqueUser(UID) {
    try {
      const numericUID = parseInt(UID, 10);
      if (isNaN(numericUID)) throw new Error(`Invalid UID: ${UID}`);
        const user = await prisma.user.findUnique({
            where: {
                uid: numericUID,
            },
        });
        // If the user is a student, include their own student info and associated course history
        if (user && user.role === 'STUDENT') {
            const studentProfile = await prisma.user.findUnique({
                where: {
                    uid: numericUID,
                },
                include: {
                    student: {
                        include: {
                            courseHistory: {
                                include: {
                                    course: true,
                                },
                            },
                        },
                    },
                },
            });
            return studentProfile;
          }

        return user;
    } catch (error) {
        console.error("Error finding user:", error);
        throw error;
    }
}


async function upsertStudentProfile(studentData) {
    // Transactionally upsert the student profile (first updates User, then Student, then CourseHistory if applicable, otherwise it creates a new User, then Student, then CourseHistory).
    try {
        const profile = await prisma.$transaction(async (tx) => {
            // 1. Upsert the User record.
            // Prisma will find a user with the given UID. If found, it updates it.
            // If not found, it creates a new one.
            await tx.user.upsert({
                where: { uid: studentData.uid },
                update: {
                    name: studentData.name,
                    email: studentData.email,
                    pronouns: studentData.pronouns,
                },
                create: {
                    uid: studentData.uid,
                    name: studentData.name,
                    email: studentData.email,
                    pronouns: studentData.pronouns,
                    role: 'STUDENT', // Set role on creation
                },
            });

            // 2. Upsert the associated Student record.
            await tx.student.upsert({
                where: { uid: studentData.uid },
                update: {
                    year: studentData.year,
                    major: studentData.major,
                    graduateStatus: studentData.graduateStatus,
                    wasPriorEmployee: studentData.wasPriorEmployee,
                    resumeURL: studentData.resumeURL,
                },
                create: {
                    uid: studentData.uid,
                    year: studentData.year,
                    major: studentData.major,
                    graduateStatus: studentData.graduateStatus,
                    wasPriorEmployee: studentData.wasPriorEmployee || false,
                    resumeURL: studentData.resumeURL,
                },
            });

            // 3. Handle Course History (if provided).
            if (studentData.courseHistory) {
                // First, remove all old course history for this student.
                await tx.courseHistory.deleteMany({
                    where: { studentUID: studentData.uid },
                });

                // If the new history array is not empty, create all new entries.
                if (studentData.courseHistory.length > 0) {
                    await tx.courseHistory.createMany({
                        data: studentData.courseHistory.map(course => ({
                            studentUID: studentData.uid,
                            courseCode: course.courseCode,
                            grade: course.grade,
                            wasPriorEmployee: course.wasPriorEmployee || false,
                        })),
                    });
                }
            }

            // 4. Return the complete, final state of the profile.
            return tx.user.findUnique({
                where: { uid: studentData.uid },
                include: {
                    student: {
                        include: {
                            courseHistory: true,
                        },
                    },
                },
            });
        });

        return profile;
    } catch (error) {
        console.error("Error in upsertStudentProfile:", error);
        throw error;
    }
}

async function applyForJobPosition(applicationData){
    try {
        // Validate required fields
        if (!applicationData.studentUID || !applicationData.jobPositionId) {
            throw new Error("Missing required fields: student and/or jobPosition ids.");
        }

        const { studentUID, jobPositionId } = applicationData;

        // Check if student and job position exist
        const student = await prisma.student.findUnique({ where: { uid: studentUID } });
        if (!student) {
            throw new Error(`Student with UID ${studentUID} not found.`);
        }

        const jobPosition = await prisma.jobPosition.findUnique({ where: { id: jobPositionId } });
        if (!jobPosition) {
            throw new Error(`Job Position with ID ${jobPositionId} not found.`);
        }

        // Check if the student has already applied for this job position
        const existingApplication = await prisma.jobPositionHistory.findFirst({
            where: {
                studentUID: studentUID,
                jobPositionId: jobPositionId,
            }
        });

        if (existingApplication) {
            throw new Error(`This student has already applied for this job position.`);
        }

        // Create a new job application within the JobPositionHistory table
        const newApplication = await prisma.jobPositionHistory.create({
            data: {
                studentUID: studentUID,
                jobPositionId: jobPositionId,
            }
        });

        return newApplication;
    } catch (error) {
        console.error("Error in applyForJobPosition:", error);
        throw error;
    }
}

module.exports = {
    getOpenPositionsWithDetails,
    getAllUsers,
    getAllCourses,
    findUniqueUser,
    upsertStudentProfile,
    searchOpenPositions,
    applyForJobPosition
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

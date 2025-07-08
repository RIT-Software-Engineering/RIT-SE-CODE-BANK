// server/server/database/query_db.js

const { PrismaClient } = require("@prisma/client");
const path = require("path");
const { gradeEnumToLetter, letterToGradeEnum, gradetoNumericValue } = require("../constants/grade");
const { locationMap } = require("../constants/location");
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
async function getOpenPositionsWithDetails(whereClause = {}) {
  try {
    const openPositions = await prisma.jobPosition.findMany({
      where: {
        jobPositionStatus: "OPEN",
        ...whereClause
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
    return openPositions;
  } catch (error) {
    console.error("Error retrieving open positions with details:", error);
    throw error;
  }
}

// Function to build the search clause
function buildSearchClause(searchTerm) {
  // Base clause shows only OPEN positions
  const where = {
    jobPositionStatus: "OPEN",
  };

  if (!searchTerm || !searchTerm.trim()) {
    return where; // Return base clause if no search term
  }

  // Add the search logic to the "course" property
  where.course = {
    OR: [
      { name: { contains: searchTerm } },
      { courseCode: { contains: searchTerm } },
    ],
  };

  return where;
}


async function buildFilterClause(filters, candidateUID) {
  const filterWhere = {};
  let candidateData = null;

  // Fetch user data if a user is specified, as it"s needed for "applied" and "eligibility"
  if (candidateUID) {
    candidateData = await prisma.candidate.findUnique({
      where: { uid: candidateUID },
      include: {
        courseHistory: true,
        jobPositionApplicationHistory: { select: { jobPositionId: true } },
      },
    });
  }

  // Add Day of the Week filter
  if (filters.days && filters.days.length > 0) {
    filterWhere.jobSchedules = {
      some: { dayOfWeek: { in: filters.days } },
    };
  }

  // Add Course Level filter
  if (filters.level) {
    filterWhere.course = {
      ...filterWhere.course,
      courseCode: { contains: `-${filters.level.charAt(0)}` },
    };
  }

  // Add Location filter
  if (filters.location && locationMap[filters.location]) {
    filterWhere.locationType = locationMap[filters.location];
  }

  // Add "Applied" filter
  if (filters.applied && filters.applied !== "Any" && candidateData) {
    const appliedPositionIds = candidateData.jobPositionApplicationHistory.map(
      (app) => app.jobPositionId
    );
    if (filters.applied === "Applied") {
      filterWhere.id = { in: appliedPositionIds };
    } else if (filters.applied === "Not Applied") {
      filterWhere.id = { notIn: appliedPositionIds };
    }
  }

  return { filterWhere, candidateData };
}

async function searchAndFilterOpenJobPositions(searchTerm, filters, candidateUID) {

    // 1. Get the "where" clause from each separate function
    const searchWhere = buildSearchClause(searchTerm);
    const { filterWhere, candidateData } = await buildFilterClause(filters, candidateUID);

    // 2. Merge the two clauses into a single, final "where" object
    const finalWhere = {
      ...searchWhere,
      ...filterWhere,
      // Manually merge the nested 'course' object to prevent it from being overwritten
      course: {
        ...(searchWhere.course || {}),
        ...(filterWhere.course || {}),
      },
    };

    // 3. Execute the single database query
    let positions = await getOpenPositionsWithDetails(finalWhere);

    // 4. Perform the post-query filter for Eligibility
    if (filters.eligibility && filters.eligibility !== "Any" && candidateData) {
        positions = positions.filter(position => {
            const gradStatusMatch = !position.graduateStatusRequirement || position.graduateStatusRequirement === candidateData.graduateStatus;
            const courseHistory = candidateData.courseHistory?.find(ch => ch.courseCode === position.courseCode);
            const courseTakenMatch = !position.courseTakenRequirement || !!courseHistory;
            const gradeMatch = !position.gradeRequirement || (courseHistory?.grade && gradetoNumericValue[courseHistory.grade] >= gradetoNumericValue[position.gradeRequirement]);
            const isEligible = gradStatusMatch && courseTakenMatch && gradeMatch;
            return filters.eligibility === "Eligible" ? isEligible : !isEligible;
        });
    }

     const positionsWithLetterGrades = positions.map(position => {
      // Check if a gradeRequirement exists on this position
      if (position.gradeRequirement) {
        return {
          ...position,
          // Convert the numeric grade requirement to a letter
          gradeRequirement: gradeEnumToLetter[position.gradeRequirement] || position.gradeRequirement
        };
      }
      // If there's no grade requirement, return the position as is
      return position;
    });

    return positionsWithLetterGrades;
}

async function updateUserResumeUrl(candidateUID, resumeURL) {
  try {
    return await prisma.candidate.update({
      where: { uid: candidateUID },
      data: { resumeURL: resumeURL },
    });
  } catch (error) {
    console.error(`Error updating resume URL for candidate ${candidateUID}:`, error);
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

//function to retrieve all courses for the onramping feature
async function getAllCourses() {
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
    // If the user is a candidate, include their own candidate info and associated course history
    if (user && user.role === "CANDIDATE") {
      const candidateProfile = await prisma.user.findUnique({
        where: {
          uid: numericUID,
        },
        include: {
          candidate: {
            include: {
              courseHistory: {
                include: {
                  course: true,
                },
              },
              jobPositionApplicationHistory: {
                include: {
                  jobPosition: true,
                },
              },
            },
          },
        },
      });
      // Translate grades from enum to letter using the provided mapping
      if (candidateProfile?.candidate?.courseHistory) {
        candidateProfile.candidate.courseHistory =
          candidateProfile.candidate.courseHistory.map((historyItem) => {
            // Check if a grade exists on the item
            if (historyItem.grade) {
              return {
                ...historyItem,
                // Look up the enum in the map and replace it
                grade:
                  gradeEnumToLetter[historyItem.grade],
              };
            }
            return historyItem; // Return the item unchanged if it has no grade
          });
      }

      return candidateProfile;
    }

    return user;
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}

async function upsertCandidateProfile(candidateData) {
  // Transactionally upsert the candidate profile (first updates User, then Candidate, then CourseHistory if applicable, otherwise it creates a new User, then Candidate, then CourseHistory).
  try {
    const profile = await prisma.$transaction(async (tx) => {
      // 1. Upsert the User record.
      // Prisma will find a user with the given UID. If found, it updates it.
      // If not found, it creates a new one.
      await tx.user.upsert({
        where: { uid: candidateData.uid },
        update: {
          name: candidateData.name,
          email: candidateData.email,
          pronouns: candidateData.pronouns,
        },
        create: {
          uid: candidateData.uid,
          name: candidateData.name,
          email: candidateData.email,
          pronouns: candidateData.pronouns,
          role: "CANDIDATE", // Set role on creation
        },
      });

      // 2. Upsert the associated Candidate record.
      await tx.candidate.upsert({
        where: { uid: candidateData.uid },
        update: {
          year: candidateData.year,
          major: candidateData.major,
          graduateStatus: candidateData.graduateStatus,
          wasPriorEmployee: candidateData.wasPriorEmployee,
          resumeURL: candidateData.resumeURL,
        },
        create: {
          uid: candidateData.uid,
          year: candidateData.year,
          major: candidateData.major,
          graduateStatus: candidateData.graduateStatus,
          wasPriorEmployee: candidateData.wasPriorEmployee || false,
          resumeURL: candidateData.resumeURL,
        },
      });

      // 3. Handle Course History (if provided).
      if (candidateData.courseHistory) {
        // First, remove all old course history for this candidate.
        await tx.courseHistory.deleteMany({
          where: { candidateUID: candidateData.uid },
        });

        // If the new history array is not empty, create all new entries.
        if (candidateData.courseHistory.length > 0) {
          await tx.courseHistory.createMany({
            data: candidateData.courseHistory.map((course) => ({
              candidateUID: candidateData.uid,
              courseCode: course.courseCode,
              grade: course.grade,
              wasPriorEmployee: course.wasPriorEmployee || false,
            })),
          });
        }
      }

      // 4. Return the complete, final state of the profile.
      return tx.user.findUnique({
        where: { uid: candidateData.uid },
        include: {
          candidate: {
            include: {
              courseHistory: true,
            },
          },
        },
      });
    });

    return profile;
  } catch (error) {
    console.error("Error in upsertCandidateProfile:", error);
    throw error;
  }
}

async function upsertEmployerProfile(employerData) {
  // Transactionally upsert the employer profile (first updates User, then Employer otherwise it creates a new User, then Employer).
  try {
    const profile = await prisma.$transaction(async (tx) => {
      // 1. Upsert the User record.
      // Prisma will find a user with the given UID. If found, it updates it.
      // If not found, it creates a new one.
      await tx.user.upsert({
        where: { uid: employerData.uid },
        update: {
          name: employerData.name,
          email: employerData.email,
          pronouns: employerData.pronouns,
        },
        create: {
          uid: employerData.uid,
          name: employerData.name,
          email: employerData.email,
          pronouns: employerData.pronouns,
          role: "EMPLOYER", // Set role on creation
        },
      });

      // 2. Upsert the associated Employer record.
      await tx.employer.upsert({
        where: { uid: employerData.uid },
        update: {
          department: employerData.department,
        },
        create: {
          uid: employerData.uid,
          department: employerData.department,
        },
      });

      // 4. Return the complete, final state of the profile.
      return tx.user.findUnique({
        where: { uid: employerData.uid },
      });
    });

    return profile;
  } catch (error) {
    console.error("Error in upsertEmployerProfile:", error);
    throw error;
  }
}

async function applyForJobPosition(jobPositionApplicationData) {
  try {
    // Validate required fields
    if (
      !jobPositionApplicationData.candidateUID ||
      !jobPositionApplicationData.jobPositionId ||
      !jobPositionApplicationData.jobPositionApplicationFormData
    ) {
      throw new Error(
        "Missing required fields: candidate and/or jobPosition ids as well as form data to apply."
      );
    }

    const { candidateUID, jobPositionId, jobPositionApplicationFormData } =
      jobPositionApplicationData;

    // Check if candidate and job position exist
    const candidate = await prisma.candidate.findUnique({
      where: { uid: candidateUID },
    });
    if (!candidate) {
      throw new Error(`Candidate with UID ${candidateUID} not found.`);
    }

    const jobPosition = await prisma.jobPosition.findUnique({
      where: { id: jobPositionId },
    });
    if (!jobPosition) {
      throw new Error(`Job Position with ID ${jobPositionId} not found.`);
    }

    // Check if the candidate has already applied for this job position
    const existingApplication =
      await prisma.jobPositionApplicationHistory.findFirst({
        where: {
          candidateUID: candidateUID,
          jobPositionId: jobPositionId,
        },
      });

    if (existingApplication) {
      throw new Error(
        `This candidate has already applied for this job position.`
      );
    }

    // Create a new job application within the JobPositionHistory table
    const newApplication = await prisma.jobPositionApplicationHistory.create({
      data: {
        candidateUID: candidateUID,
        jobPositionId: jobPositionId,
        applicationData: jobPositionApplicationFormData,
      },
    });

    // Update the candidate's course history with the new grade
    await prisma.courseHistory.updateMany({
      where:{
        candidateUID: candidateUID,
        courseCode: jobPosition.courseCode
      },
      data: {
        grade: letterToGradeEnum[jobPositionApplicationFormData.grade]
      }
    })

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
  upsertCandidateProfile,
  upsertEmployerProfile,
  searchAndFilterOpenJobPositions,
  applyForJobPosition,
  updateUserResumeUrl
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

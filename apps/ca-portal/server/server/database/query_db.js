// server/server/database/query_db.js

// =============================================================================
// SETUP & INITIALIZATION
// =============================================================================

const { PrismaClient } = require("@prisma/client");
const path = require("path");
const {
  gradeEnumToLetter,
  letterToGradeEnum,
  gradetoNumericValue,
} = require("../constants/grade");
const { locationMap } = require("../constants/location");

// Ensure dotenv is loaded for DATABASE_URL if this file is ever run directly.
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
}

// Initialize Prisma Client for database interaction.
const prisma = new PrismaClient();

// =============================================================================
// JOB POSITION & APPLICATION QUERIES
// =============================================================================

// --- Private Helper Functions for Job Search ---

/**
 * Constructs a Prisma `where` clause for text-based searching on course name or code.
 * @param {string} searchTerm - The search term entered by the user.
 * @returns {object} A Prisma `where` clause for the search functionality.
 */
function buildSearchClause(searchTerm) {
  // Base clause shows only OPEN positions by default.
  const where = {
    jobPositionStatus: "OPEN",
  };

  // If there's no search term, return the base clause.
  if (!searchTerm || !searchTerm.trim()) {
    return where;
  }

  // Add search logic to filter by course name or course code.
  where.course = {
    OR: [
      { name: { contains: searchTerm } },
      { courseCode: { contains: searchTerm } },
    ],
  };

  return where;
}

/**
 * Constructs a Prisma `where` clause from various filter options.
 * @param {object} filters - An object containing filter criteria (e.g., days, level, location, applied).
 * @param {number} candidateUID - The UID of the candidate to check "applied" status against.
 * @returns {Promise<object>} A promise that resolves to an object containing the filter `where` clause and fetched candidate data.
 */
async function buildFilterClause(filters, candidateUID) {
  const filterWhere = {};
  let candidateData = null;

  // Fetch candidate data if needed for "applied" or "eligibility" filters.
  if (candidateUID) {
    candidateData = await prisma.candidate.findUnique({
      where: { uid: candidateUID },
      include: {
        courseHistory: true,
        jobPositionApplicationHistory: { select: { jobPositionId: true } },
      },
    });
  }

  // Add "Day of the Week" filter.
  if (filters.days && filters.days.length > 0) {
    filterWhere.jobSchedules = {
      some: { dayOfWeek: { in: filters.days } },
    };
  }

  // Add "Course Level" filter (e.g., "100", "200").
  if (filters.level) {
    filterWhere.course = {
      ...filterWhere.course,
      courseCode: { contains: `-${filters.level.charAt(0)}` },
    };
  }

  // Add "Location" filter.
  if (filters.location && locationMap[filters.location]) {
    filterWhere.locationType = locationMap[filters.location];
  }

  // Add "Applied" status filter.
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

/**
 * Retrieves job positions from the database based on a given `where` clause.
 * @param {object} whereClause - The Prisma `where` clause to filter positions. Defaults to an empty object.
 * @returns {Promise<Array>} A promise that resolves to an array of open positions with their course and schedule details.
 */
async function getOpenPositionsWithDetails(whereClause = {}) {
  try {
    return await prisma.jobPosition.findMany({
      where: {
        jobPositionStatus: "OPEN",
        ...whereClause,
      },
      include: {
        course: {
          select: { name: true, description: true, courseCode: true },
        },
        jobSchedules: {
          select: { dayOfWeek: true, startTime: true, endTime: true },
        },
      },
      orderBy: {
        course: {
          name: "asc",
        },
      },
    });
  } catch (error) {
    console.error("Error retrieving open positions with details:", error);
    throw error;
  }
}

async function modifyPosition(jobID, positionData) {
  try {
    // Destructure only the valid, editable fields from the incoming data
    const {
      maxCAs,
      jobPositionStatus,
      location,
      locationType,
      graduateStatusRequirement,
      gradeRequirement,
      courseTakenRequirement,
      startDate,
      endDate,
      jobSchedule
    } = positionData;

    return await prisma.$transaction(async (tx) => {
      // Update the job position
      const updatedPosition = await tx.jobPosition.update({
        where: {
          id: jobID, // Use the ID to find the correct position
        },
        data: {
          // Only include the fields that belong to the JobPosition model
          maxCAs,
          jobPositionStatus,
          location,
          locationType,
          graduateStatusRequirement,
          gradeRequirement,
          courseTakenRequirement,
          startDate,
          endDate,
        },
        include: {
          course: true,
          jobSchedules: true
        },
      });

      // Update job schedules if provided
      if (positionData.jobSchedule && Array.isArray(positionData.jobSchedule)) {
        for (const schedule of positionData.jobSchedule) {
          await tx.jobSchedule.update({
            where: {
              jobPositionId: jobID
            },
            data: {
              startTime: schedule.startTime,
              endTime: schedule.endTime,
              dayOfWeek: schedule.dayOfWeek,
            },
          });
        }
      }
      return updatedPosition;
    });
  } catch (error) {
    console.error("Error modifying position:", error);
    throw error;
  }
}

// // NOTE TO DEV: Not sure in what databases we should be deleting it in

// /**
//  * Deletes a JobPosition and all its related records from the database.
//  * @param {string} jobId The ID of the job position to delete.
//  * @returns {Promise<object>} The deleted JobPosition object.
//  */
// export async function deleteJobPosition(jobId) {
//   try {
//     // A transaction ensures all these operations succeed or none do.
//     const result = await prisma.$transaction([
//       // 1. Delete all related job schedules
//       prisma.jobSchedule.deleteMany({
//         where: { jobPositionId: jobId },
//       }),

//       // 3. Delete all related job position histories
//       // Note: This also implies TimeLogHistory records linked to these will be an issue
//       // if not handled by cascading deletes in the schema. For simplicity, we assume
//       // deleting the history is sufficient or cascades are in place.
//       prisma.jobPositionHistory.deleteMany({
//         where: { jobPositionId: jobId },
//       }),

//       // 4. Finally, delete the actual JobPosition
//       prisma.jobPosition.delete({
//         where: { id: jobId },
//       }),
//     ]);

//     // The result of a transaction is an array of the results of each operation.
//     // We return the last one, which is the deleted JobPosition object.
//     const deletedJobPosition = result[result.length - 1];

//     console.log(
//       `Successfully deleted JobPosition ${jobId} and its related records.`
//     );
//     return deletedJobPosition;
//   } catch (error) {
//     console.error(`Failed to delete JobPosition ${jobId}:`, error);
//     // Re-throw the error so the calling function in your API route can handle it
//     throw new Error(`Could not delete job position ${jobId}.`);
//   }
// }
// --- Public Functions for Job Search & Retrieval ---

/**
 * Searches and filters open job positions based on a search term and a set of filters.
 * @param {string} searchTerm - The text to search for in course names and codes.
 * @param {object} filters - The filter criteria (eligibility, days, level, location, applied).
 * @param {number} candidateUID - The UID of the viewing candidate, used for "applied" and "eligibility" checks.
 * @returns {Promise<Array>} A promise that resolves to an array of filtered and processed job positions.
 */
async function searchAndFilterOpenJobPositions(
  searchTerm,
  filters,
  candidateUID
) {
  // 1. Build the search and filter clauses separately.
  const searchWhere = buildSearchClause(searchTerm);
  const { filterWhere, candidateData } = await buildFilterClause(
    filters,
    candidateUID
  );

  // 2. Merge the clauses into a single `where` object for one database query.
  const finalWhere = {
    ...searchWhere,
    ...filterWhere,
    // Manually merge the nested 'course' object to prevent it from being overwritten.
    course: {
      ...(searchWhere.course || {}),
      ...(filterWhere.course || {}),
    },
  };

  // 3. Execute the single database query to get a preliminary list of positions.
  let positions = await getOpenPositionsWithDetails(finalWhere);

  // 4. Perform post-query filtering for "Eligibility" as it requires complex logic on fetched data.
  if (filters.eligibility && filters.eligibility !== "Any" && candidateData) {
    positions = positions.filter((position) => {
      const gradStatusMatch =
        !position.graduateStatusRequirement ||
        position.graduateStatusRequirement === candidateData.graduateStatus;
      const courseHistory = candidateData.courseHistory?.find(
        (ch) => ch.courseCode === position.courseCode
      );
      const courseTakenMatch =
        !position.courseTakenRequirement || !!courseHistory;
      const gradeMatch =
        !position.gradeRequirement ||
        (courseHistory?.grade &&
          gradetoNumericValue[courseHistory.grade] >=
            gradetoNumericValue[position.gradeRequirement]);
      const isEligible = gradStatusMatch && courseTakenMatch && gradeMatch;
      return filters.eligibility === "Eligible" ? isEligible : !isEligible;
    });
  }

  // 5. Convert grade requirement enums to human-readable letter grades for the frontend.
  return positions.map((position) => {
    if (position.gradeRequirement) {
      return {
        ...position,
        gradeRequirement:
          gradeEnumToLetter[position.gradeRequirement] ||
          position.gradeRequirement,
      };
    }
    return position;
  });
}

/**
 * Creates a new job application record for a candidate.
 * @param {object} applicationDetails - The application data.
 * @param {number} applicationDetails.candidateUID - The UID of the applicant.
 * @param {string} applicationDetails.jobPositionId - The ID of the job position.
 * @param {number} applicationDetails.resumeId - The ID of the resume being used for the application.
 * @param {string} applicationDetails.jobPositionApplicationFormData - The JSON string of the form data.
 * @returns {Promise<object>} A promise that resolves to the newly created application record.
 */
async function applyForJobPosition(applicationDetails) {
  try {
    const { candidateUID, jobPositionId, resumeId, jobPositionApplicationFormData } =
      applicationDetails;

    // 1. Validate required fields.
    if (!candidateUID || !jobPositionId || !resumeId || !jobPositionApplicationFormData) {
      throw new Error(
        'Missing required fields: candidate UID, job position ID, resume ID, or form data.'
      );
    }

    // 2. Verify that the candidate, job position, and resume exist.
    const [candidate, jobPosition, resume] = await Promise.all([
      prisma.candidate.findUnique({ where: { uid: candidateUID } }),
      prisma.jobPosition.findUnique({ where: { id: jobPositionId } }),
      prisma.resume.findFirst({ where: { id: resumeId, candidateUID: candidateUID } }),
    ]);
    if (!candidate) throw new Error(`Candidate with UID ${candidateUID} not found.`);
    if (!jobPosition) throw new Error(`Job Position with ID ${jobPositionId} not found.`);
    if (!resume) throw new Error(`Resume with ID ${resumeId} not found for this candidate.`);

    // 3. Check if the candidate has already applied.
    const existingApplication =
      await prisma.jobPositionApplicationHistory.findFirst({
        where: { candidateUID, jobPositionId },
      });
    if (existingApplication) {
      throw new Error(
        "This candidate has already applied for this job position."
      );
    }

    // 4. Create the new application record.
    const newApplication = await prisma.jobPositionApplicationHistory.create({
      data: {
        candidateUID,
        jobPositionId,
        resumeId: resumeId,
        applicationData: jobPositionApplicationFormData,
      },
    });

    // 5. Update the candidate's course history with the self-reported grade.
    const parsedFormData = JSON.parse(jobPositionApplicationFormData);
    if (parsedFormData.grade) {
        await prisma.courseHistory.updateMany({
            where: { candidateUID, courseCode: jobPosition.courseCode },
            data: { grade: letterToGradeEnum[parsedFormData.grade] },
        });
    }

    return newApplication;
  } catch (error) {
    console.error("Error in applyForJobPosition:", error);
    throw error;
  }
}

/**
 * Deletes a candidate's application for a specific job position.
 * The combination of candidateUID and jobPositionId must be unique.
 * @param {number} candidateUID - The UID of the candidate.
 * @param {string} jobPositionId - The ID of the job position.
 * @returns {Promise<object>} A promise that resolves to the deleted application record.
 */
async function deleteCandidateApplication(candidateUID, jobPositionId) {
  try {
    const applicationToDelete = await prisma.jobPositionApplicationHistory.findFirst({
      where: {
        candidateUID: candidateUID,
        jobPositionId: jobPositionId,
      },
    });

    if (!applicationToDelete) {
      throw new Error("Application not found for the specified candidate and job position.");
    }

    return await prisma.jobPositionApplicationHistory.delete({
      where: {
        id: applicationToDelete.id,
      },
    });
  } catch (error) {
    console.error('Error in deleteCandidateApplication:', error);
    throw error;
  }
}

/**
 * Retrieves all candidate applications for a specific candidate/employee.
 * @param {number} UID - The UID of the candidate/employee.
 * @returns {Promise<object>} A promise that resolves to an object of applications, grouped by job position ID.
 */
async function getCandidateApplications(UID) {
  try{
    const applications = await prisma.jobPositionApplicationHistory.findMany({
      where: { candidateUID: UID },
      include: {
        jobPosition: {
          include: {
            course: {
              select: { name: true, description: true },
            },
            jobSchedules: {
              select: { dayOfWeek: true, startTime: true, endTime: true },
            },
          },
        },
        resume: {
          select: { name: true, resumeURL: true },
        },
      },
    });
    return applications;
  } catch (error) {
    console.error('Error in getCandidateApplications:', error);
    throw error;
  }
}


/**
 * Retrieves all candidate applications for all job positions managed by a specific faculty member.
 * @param {number} facultyUid - The UID of the faculty member (employer).
 * @returns {Promise<object>} A promise that resolves to an object of applications, grouped by job position ID.
 */
async function getCandidateApplicationsForFaculty(facultyUid) {
  try {
    // 1. Find all active job positions for the given faculty member.
    const positionsList = await prisma.JobPosition.findMany({
      where: { facultyUID: facultyUid, NOT: { jobPositionStatus: "INACTIVE" } },
      include: {
        // Include all applications for each position.
        jobPositionApplicationHistory: {
          include: {
            // For each application, include detailed candidate information.
            candidate: {
              select: {
                year: true,
                major: true,
                graduateStatus: true,
                wasPriorEmployee: true,
                user: { select: { name: true, email: true, uid: true } },
                courseHistory: {
                  select: {
                    courseCode: true,
                    grade: true,
                    wasPriorEmployee: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    // 2. Process the results to enrich application data.
    positionsList.forEach((position) => {
      position.jobPositionApplicationHistory.forEach((application) => {
        if (application.candidate?.courseHistory) {
          // Find the candidate's grade for the specific course they are applying to.
          const relevantCourse = application.candidate.courseHistory.find(
            (course) => course.courseCode === position.courseCode
          );
          application.gradeInCourse = relevantCourse
            ? gradeEnumToLetter[relevantCourse.grade]
            : "N/A";

          // List all courses the candidate has previously been a TA for.
          application.previouslyTAedCourses =
            application.candidate.courseHistory
              .filter((course) => course.wasPriorEmployee)
              .map((course) => course.courseCode);

          // Clean up the object by removing the full course history.
          delete application.candidate.courseHistory;
        }
      });
    });

    // 3. Group the processed list of positions by their ID for easy lookup on the frontend.
    return positionsList.reduce((accumulator, currentPosition) => {
      accumulator[currentPosition.id] = currentPosition;
      return accumulator;
    }, {});
  } catch (error) {
    console.log("Error in getCandidateApplications:", error);
    throw error;
  }
}

// =============================================================================
// USER & PROFILE MANAGEMENT
// =============================================================================

/**
 * Retrieves a unique user's profile, including role-specific details (e.g., candidate or employer info).
 * @param {string|number} UID - The unique identifier of the user.
 * @returns {Promise<object|null>} A promise that resolves to the user's complete profile, or null if not found.
 */
async function findUniqueUser(UID) {
  try {
    const user = await prisma.user.findUnique({ where: { uid: UID } });

    // If no user is found, return null.
    if (!user) return null;

    // If the user is a Candidate or Employee, fetch their detailed candidate profile.
    if (user.role === "CANDIDATE" || user.role === "EMPLOYEE") {
      const candidateProfile = await prisma.user.findUnique({
        where: { uid: UID },
        include: {
          candidate: {
            include: {
              resumes: true,
              courseHistory: { include: { course: true } },
              jobPositionApplicationHistory: { include: { jobPosition: true } },
            },
          },
        },
      });
      // Convert grade enums to letter grades for display.
      if (candidateProfile?.candidate?.courseHistory) {
        candidateProfile.candidate.courseHistory =
          candidateProfile.candidate.courseHistory.map((history) => ({
            ...history,
            grade: history.grade
              ? gradeEnumToLetter[history.grade]
              : history.grade,
          }));
      }
      return candidateProfile;
    }

    // If the user is an Employer or Admin, fetch their detailed faculty profile.
    if (user.role === "EMPLOYER" || user.role === "ADMIN") {
      return prisma.user.findUnique({
        where: { uid: UID },
        include: {
          employer: {
            include: { jobPostions: { include: { course: true, jobSchedules: true } } },
          },
        },
      });
    }

    // Return the basic user object if they have a different role.
    return user;
  } catch (error) {
    console.error("Error finding user:", error);
    throw error;
  }
}

/**
 * Creates or updates a candidate's entire profile in a single, atomic transaction.
 * @param {object} candidateData - The complete data for the candidate profile.
 * @returns {Promise<object>} A promise that resolves to the final, updated candidate profile.
 */
async function upsertCandidateProfile(candidateData) {
  try {
    // Use a transaction to ensure all or no database operations are completed.
    return await prisma.$transaction(async (tx) => {
      // 1. Upsert the base User record.
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
          role: "CANDIDATE",
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
        },
        create: {
          uid: candidateData.uid,
          year: candidateData.year,
          major: candidateData.major,
          graduateStatus: candidateData.graduateStatus,
          wasPriorEmployee: candidateData.wasPriorEmployee || false,
        },
      });

      // 3. Handle Course History (if provided).
      if (candidateData.courseHistory) {
        // First, remove all existing course history for this candidate to prevent duplicates.
        await tx.courseHistory.deleteMany({
          where: { candidateUID: candidateData.uid },
        });

        // If new history is provided, create all new entries.
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
          candidate: { include: { courseHistory: true } },
        },
      });
    });
  } catch (error) {
    console.error("Error in upsertCandidateProfile:", error);
    throw error;
  }
}

/**
 * Creates or updates an employer's profile in a single, atomic transaction.
 * @param {object} employerData - The complete data for the employer profile.
 * @returns {Promise<object>} A promise that resolves to the final, updated employer profile.
 */
async function upsertEmployerProfile(employerData) {
  try {
    // Use a transaction for atomicity.
    return await prisma.$transaction(async (tx) => {
      // 1. Upsert the base User record.
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
          role: "EMPLOYER",
        },
      });

      // 2. Upsert the associated Employer record.
      await tx.employer.upsert({
        where: { uid: employerData.uid },
        update: { department: employerData.department },
        create: { uid: employerData.uid, department: employerData.department },
      });

      // 3. Return the complete, final state of the profile.
      return tx.user.findUnique({ where: { uid: employerData.uid } });
    });
  } catch (error) {
    console.error("Error in upsertEmployerProfile:", error);
    throw error;
  }
}

// =============================================================================
// RESUME QUERIES
// =============================================================================

/**
 * Adds a new resume for a candidate.
 * @param {number} candidateUID - The unique identifier of the candidate.
 * @param {string} resumeURL - The URL of the candidate's resume.
 * @param {boolean} isPrimary - Whether the resume is the primary resume for the candidate.
 * @param {string} name - The name of the resume.
 * @returns {Promise<object>} A promise that resolves to the newly created resume record.
 */
async function addNewCandidateResume(candidateUID, isPrimary, resumeURL, name) {
  try {
    return await prisma.resume.create({
      data: {
        candidateUID: candidateUID,
        isPrimary: isPrimary,
        resumeURL: resumeURL,
        name: name,
      },
    })
  } catch (error) {
    console.error('Error adding new resume:', error);
    throw error;
  }
}

/**
 * Sets a specific resume as the primary one for a candidate.
 * @param {number} candidateUID - The unique identifier of the candidate.
 * @param {number} resumeId - The unique identifier of the resume to set as primary.
 * @returns {Promise<object>} A promise that resolves to the updated resume record.
 */
async function updatePrimaryResume(candidateUID, resumeId) {
  try {
    // Use a transaction to ensure both operations succeed or fail together
    return await prisma.$transaction(async (tx) => {
      // Step 1: Set all of the candidate's resumes to non-primary
      await tx.resume.updateMany({
        where: {
          candidateUID: candidateUID,
        },
        data: {
          isPrimary: false,
        },
      });

      // Step 2: Set the specified resume to primary
      const updatedResume = await tx.resume.update({
        where: {
          id: resumeId,
        },
        data: {
          isPrimary: true,
        },
      });

      return updatedResume;
    });
  } catch (error) {
    console.error('Error updating primary resume:', error);
    throw error;
  }
}

/**
 * Resets all resumes for a candidate to non-primary status.
 * @param {number} candidateUID - The unique identifier of the candidate.
 * @returns {Promise<object>} A promise that resolves to the result of the update operation.
 */
async function resetResumesToNonPrimary(candidateUID) {
  try {
    return await prisma.resume.updateMany({
      where: {
        candidateUID: candidateUID,
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });
  } catch (error) {
    console.error('Error resetting resumes to non-primary:', error);
    throw error;
  }
}

/**
 * Deletes a resume for a candidate.
 * @param {number} resumeId - The unique identifier of the resume to delete.
 * @returns {Promise<object>} A promise that resolves to the deleted resume record.
 */
async function deleteResume(resumeId) {
  try {
    return await prisma.resume.delete({
      where: {
        id: resumeId,
      },
    });
  } catch (error) {
    console.error('Error deleting resume:', error);
    throw error;
  }
}

// =============================================================================
// GENERAL & UTILITY QUERIES
// =============================================================================

/**
 * Retrieves all users from the database.
 * @returns {Promise<Array>} A promise that resolves to an array of all user objects.
 */
async function getAllUsers() {
  try {
    return await prisma.user.findMany();
  } catch (error) {
    console.error("Error retrieving users:", error);
    throw error;
  }
}

/**
 * Retrieves all courses from the database, selecting only the course code and name.
 * @returns {Promise<Array>} A promise that resolves to an array of all course objects.
 */
async function getAllCourses() {
  try {
    return await prisma.course.findMany({
      select: {
        courseCode: true,
        name: true,
      },
    });
  } catch (error) {
    console.error("Error retrieving courses:", error);
    throw error;
  }
}

// =============================================================================
// EXPORTS & PROCESS HANDLING
// =============================================================================

module.exports = {
  searchAndFilterOpenJobPositions,
  deleteCandidateApplication,
  getCandidateApplications,
  getCandidateApplicationsForFaculty,
  applyForJobPosition,
  findUniqueUser,
  upsertCandidateProfile,
  upsertEmployerProfile,
  addNewCandidateResume,
  updatePrimaryResume,
  resetResumesToNonPrimary,
  deleteResume,
  getAllUsers,
  getAllCourses,
  modifyPosition,
};

// Add process exit handlers to disconnect Prisma Client gracefully.
process.on("beforeExit", () => prisma.$disconnect());
process.on("SIGINT", async () => {
  await prisma.$disconnect();
  process.exit(0);
});
process.on("SIGTERM", async () => {
  await prisma.$disconnect();
  process.exit(0);
});

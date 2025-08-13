// server/server/database/query_db.js

// =============================================================================
// SETUP & INITIALIZATION
// =============================================================================

const { PrismaClient } = require("@prisma/client");
const path = require("path");
const { gradetoNumericValue } = require("../constants/grade");
const { locationMap } = require("../constants/location");
const { applicationStatusStringToEnum } = require('../constants/status');
const { verifyPassword, hashPassword } = require("../config/passwordHashes");

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
function buildPositionSearchClause(searchTerm) {
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
 * @param {string} candidateUsername - The username of the logged-in user, used for "applied" and "eligibility" filters for candidate data.
 * @returns {Promise<object>} A promise that resolves to an object containing the filter `where` clause and fetched candidate data.
 */
async function buildPositionFilterClause(filters, candidateUsername) {
  const filterWhere = {};
  let candidateData = null;

  // Fetch candidate data if needed for "applied" or "eligibility" filters.
  if (candidateUsername) {
    candidateData = await prisma.candidate.findUnique({
      where: { username: candidateUsername },
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

  // Add "Course Level" filter (e.g., "100-level", "200-level").
  if (
    filters.level &&
    Array.isArray(filters.level) &&
    filters.level.length > 0
  ) {
    const levelConditions = filters.level.map((levelString) => {
      // Extracts the first digit from strings like "100-level" -> "1"
      const levelDigit = levelString.replace("-level", "").charAt(0);
      return {
        courseCode: {
          contains: `-${levelDigit}`,
        },
      };
    });

    // Add the OR conditions to the main filter clause.
    filterWhere.OR = levelConditions;
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

// --- Public Functions for Job Search ---
/**
 * Searches and filters open job positions based on a search term and a set of filters.
 * @param {string} searchTerm - The text to search for in course names and codes.
 * @param {object} filters - The filter criteria (eligibility, days, level, location, applied).
 * @param {string} candidateUsername - The username of the logged-in user, used for "applied" and "eligibility" filters for candidate data.
 * @returns {Promise<Array>} A promise that resolves to an array of filtered and processed job positions.
 */
async function getOpenJobPositions(
  searchTerm,
  filters,
  candidateUsername
) {
  try {
    // 1. Build the search and filter clauses separately.
    const searchWhere = buildPositionSearchClause(searchTerm);
    const { filterWhere, candidateData } = await buildPositionFilterClause(
      filters,
      candidateUsername
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
    // Add a default job position status filter to show only OPEN positions.
    finalWhere.jobPositionStatus = "OPEN";

    // 3. Execute the single database query to get a preliminary list of positions.
    let positions = await prisma.jobPosition.findMany({
      where: finalWhere,
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

    // 5. return the filtered and processed positions
    return positions;
  } catch (error) {
    console.error("Error in getOpenJobPositions:", error);
    throw error;
  }
}

async function getJobPositionsByStatus(status, username = null) {
  const whereClause = {
    jobPositionStatus: status,
  };

  console.log("Employeer is ", username);
  if (username) {
    whereClause.username = username;
  }

  try {
    console.log("getting query");
    console.log("Where Clause is ", whereClause);
    return await prisma.jobPosition.findMany({
      where: whereClause,
      include: {
        course: {
          select: { name: true, description: true, courseCode: true },
        },
        jobSchedules: {
          select: { dayOfWeek: true, startTime: true, endTime: true },
        },
        // comment: {
        //   select: { comment: true, timestamp: true },
        //   orderBy: {
        //     timestamp: "desc", // Order comments by timestamp, newest first
        //   },
        // },
      },
      orderBy: {
        id: "asc", // Or any other order you prefer
      },
    });
  } catch (error) {
    console.error("Error retrieving pending job positions:", error);
    throw error;
  }
}
/**
 * Modifies an existing job position in the database.
 * @param {string} jobId - The ID of the job position to modify.
 * @param {object} positionData - The updated data for the job position.
 * @returns {Promise<object>} A promise that resolves to the modified job position.
 */
async function modifyPosition(jobId, positionData) {
  // Separate the schedules array from the rest of the job data
  const { jobSchedules, ...jobData } = positionData;

  try {
    // Use a transaction to ensure all operations succeed or none do
    const result = await prisma.$transaction(async (tx) => {
      // 1. Update the direct fields of the JobPosition model
      await tx.jobPosition.update({
        where: { id: jobId },
        data: {
          location: jobData.location,
          locationType: jobData.locationType,
          maxTAs: jobData.maxTAs,
          startDate: jobData.startDate,
          endDate: jobData.endDate,
          jobPositionStatus: jobData.jobPositionStatus,
          graduateStatusRequirement: jobData.graduateStatusRequirement,
          gradeRequirement: jobData.gradeRequirement,
          courseTakenRequirement: jobData.courseTakenRequirement,
        },
      });

      // 2. Delete all existing schedules for this job
      await tx.jobSchedule.deleteMany({
        where: { jobPositionId: jobId },
      });

      // 3. Create the new schedules from the data sent by the frontend
      if (jobSchedules && jobSchedules.length > 0) {
        const schedulesToCreate = jobSchedules.map((sch) => ({
          jobPositionId: jobId,
          dayOfWeek: sch.dayOfWeek,
          // FIX: Pass the ISO string directly to Prisma without creating a new Date object.
          // This prevents the server's timezone from altering the UTC time.
          startTime: sch.startTime,
          endTime: sch.endTime,
        }));

        await tx.jobSchedule.createMany({
          data: schedulesToCreate,
        });
      }

      // 4. Fetch and return the fully updated job with all its relations
      const finalJob = await tx.jobPosition.findUnique({
        where: { id: jobId },
        include: {
          course: true,
          jobSchedules: true,
        },
      });

      return finalJob;
    });

    return result;
  } catch (error) {
    console.error(`Failed to modify position ${jobId}:`, error);
    throw new Error(`Could not modify job position ${jobId}.`);
  }
}

/**
 * Gets all job positions from the database.
 * @returns {Promise<object>} A Promise that resolves to an array of all job positions.
 */
async function getAllPositions() {
  try {
    return await prisma.jobPosition.findMany({
      include: {
        course: true,
        jobSchedules: true,
      },
    });
  } catch (error) {
    console.error("Error retrieving all job positions:", error);
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
 * Creates a new JobPosition and its related schedules.
 * @param {object} positionData The data for the new position from the form.
 * @param {string} employerUsername The username of the employer creating the position.
 * @returns {Promise<object>} The newly created JobPosition object with all relations.
 */
async function createPosition(positionData, employerUsername) {
  const { jobSchedules, ...jobData } = positionData;
  // The unique ID is a combination of semester, course, and section.
  const newJobId = `${jobData.semesterCode}-${jobData.courseCode}-${jobData.sectionNumber}`;
  try {
    const newPosition = await prisma.jobPosition.create({
      data: {
        id: newJobId,
        sectionNumber: parseInt(jobData.sectionNumber, 10),
        semesterCode: parseInt(jobData.semesterCode, 10),
        gradeRequirement: jobData.gradeRequirement,
        graduateStatusRequirement: jobData.graduateStatusRequirement,
        courseTakenRequirement: jobData.courseTakenRequirement,
        course: {
          connect: { courseCode: jobData.courseCode },
        },
        employer: {
          connect: { username: employerUsername },
        },        
        maxTAs: jobData.maxTAs,
        location: jobData.location,
        locationType: jobData.locationType,
        startDate: jobData.startDate,
        endDate: jobData.endDate,
        // Create the related schedules at the same time
        jobSchedules: {
          create: (jobSchedules || []).map((sch) => ({
            dayOfWeek: sch.dayOfWeek,
            startTime: sch.startTime,
            endTime: sch.endTime,
          })),
        },
      },
      include: {
        course: true,
        jobSchedules: true,
      },
    });

    return newPosition;
  } catch (error) {
    // Handle potential unique constraint violation if the ID already exists
    if (error.code === "P2002") {
      throw new Error(`A job position with ID ${newJobId} already exists.`);
    }
    console.error(`Failed to create position:`, error);
    throw new Error(`Could not create job position.`);
  }
}

/**
 * Creates a new job application record for a candidate.
 * @param {object} applicationDetails - The application data.
 * @param {string} applicationDetails.candidateUsername - The username of the candidate.
 * @param {number} applicationDetails.candidateUID - The UID of the candidate.
 * @param {string} applicationDetails.jobPositionId - The ID of the job position.
 * @param {number} applicationDetails.resumeId - The ID of the resume being used for the application.
 * @param {string} applicationDetails.jobPositionApplicationFormData - The JSON string of the form data.
 * @returns {Promise<object>} A promise that resolves to the newly created application record.
 */
async function applyForJobPosition(applicationDetails) {
  try {
    const {
      candidateUsername,
      jobPositionId,
      resumeId,
      jobPositionApplicationFormData,
      coverLetterURL,
      coverLetterName,
    } = applicationDetails;

    // 1. Validate required fields.
    if (
      !candidateUsername ||
      !jobPositionId ||
      !resumeId ||
      !jobPositionApplicationFormData
    ) {
      throw new Error(
        "Missing required fields: candidate username, job position ID, resume ID, or form data."
      );
    }

    // 2. Verify that the candidate, job position, and resume exist.
    const [candidate, jobPosition, resume] = await Promise.all([
      prisma.candidate.findUnique({ where: { username: candidateUsername } }),
      prisma.jobPosition.findUnique({ where: { id: jobPositionId } }),
      prisma.resume.findFirst({
        where: { id: resumeId, username: candidateUsername },
      }),
    ]);
    if (!candidate)
      throw new Error(`Candidate with username ${candidateUsername} not found.`);
    if (!jobPosition)
      throw new Error(`Job Position with ID ${jobPositionId} not found.`);
    if (!resume)
      throw new Error(
        `Resume with ID ${resumeId} not found for this candidate.`
      );

    // 3. Check if the candidate has already applied.
    const existingApplication =
      await prisma.jobPositionApplicationHistory.findFirst({
        where: { username: candidateUsername, jobPositionId },
      });
    if (existingApplication) {
      throw new Error(
        "This candidate has already applied for this job position."
      );
    }
    const applicationFormData = JSON.parse(jobPositionApplicationFormData);

    // 4. Create the new application record.
    const newApplication = await prisma.jobPositionApplicationHistory.create({
      data: {
        username: candidateUsername,
        candidateUID: applicationFormData.uid,
        jobPositionId,
        resumeId: resumeId,
        candidateFName: applicationFormData.fname,
        candidateLName: applicationFormData.lname,
        candidatePronouns: applicationFormData.pronouns,
        candidateEmail: applicationFormData.email,
        candidateMajor: applicationFormData.major,
        candidateYear: parseInt(applicationFormData.year, 10),
        candidateGrade: applicationFormData.grade,
        wasPriorEmployeeForThisCourse:
          applicationFormData.wasPriorEmployeeForThisCourse,
        wasPriorEmployeeForOtherCourses:
          applicationFormData.wasPriorEmployeeForOtherCourses,
        priorEmploymentHistory: applicationFormData.priorEmploymentHistory
          ?.map((item) => item.courseCode)
          .join(", "),
        coverLetterName: coverLetterName,
        coverLetterURL: coverLetterURL,
      },
    });

    // 5. Create a comment record for the new application.
    await prisma.comment.create({
        data: {
          foreignTableName: 'JobPositionApplicationHistory',
          foreignKey: String(newApplication.id), // Use the ID from the just-created application
          author: applicationFormData.fname + ' ' + applicationFormData.lname,
          status: 'APPLIED',                     // The initial status
          comment: 'Candidate submitted application.', // A system-generated comment
          timestamp: new Date(),
        },
      });

    return newApplication;
  } catch (error) {
    console.error("Error in applyForJobPosition:", error);
    throw error;
  }
}

/**
 * Helper function to get the application (current used for deletion of application and cover letter file specifically)
 * @param {string} candidateUsername - The username of the candidate.
 * @param {number} jobPositionId - The ID of the job position.
 * @returns {Promise<object>} A promise that resolves to the application record.
*/
async function getCandidateApplication(candidateUsername, jobPositionId) {
  const application =
    await prisma.jobPositionApplicationHistory.findFirst({
      where: {
        username: candidateUsername,
        jobPositionId: jobPositionId,
      },
    });

  if (!application) {
    throw new Error(
      "Application not found for the specified candidate and job position."
    );
  }

  return application;
}

/**
 * Deletes a candidate's application and its entire comment history.
 * @param {string} jobPositionId - The ID of the job position.
 * @returns {Promise<object>} A promise that resolves to the deleted application record.
 */
async function deleteCandidateApplication(applicationId) {
  try {
    // Delete all comments associated with this application.
    await prisma.comment.deleteMany({
      where: {
        foreignTableName: "JobPositionApplicationHistory",
        foreignKey: String(applicationId),
      },
    });

    // Finally, delete the application record itself using its unique ID.
    const deletedApplication =
      await prisma.jobPositionApplicationHistory.delete({
        where: {
          id: applicationId,
        },
      });

    return deletedApplication;
  } catch (error) {
    console.error("Error in deleteCandidateApplication:", error);
    throw error;
  }
}

/**
 * Checks if a candidate has already been hired or has at least accepted an offer for another job position. 
 * This is used to prevent candidates from applying for multiple positions by notifing employers and administrators that this candidate has already been hired for this semester.
 * @param {string} candidateUsername - The username of the candidate.
 * @param (number} semestercode - The semester code that the employer is hiring for.
 * @returns {Promise<boolean>} A promise that resolves to true if the candidate has been hired, false otherwise.
 */
async function getCandidateHiredStatus(candidateUsername, semestercode) {
  const application = await prisma.jobPositionApplicationHistory.findFirst({
    where: {
      username: candidateUsername,
      jobApplicationStatus: { in: ['ACCEPTED_OFFER', 'HIRED'] },
      jobPosition: {
        semesterCode: semestercode,
      },
    },
  });
  return !!application;
}



/**
 * Updates an application's status and creates a new comment record in a transaction.
 * @param {string} author - The full name of the user who is changing the application status.
 * @param {string} applicationId - The ID of the JobPositionApplicationHistory record.
 * @param {string} status - The new status for the application (e.g., 'Rejected', 'Accepted').
 * @param {string} comments - The text for the new comment record.
 * @returns {Promise<object>} The updated application record.
 */
async function changeCandidateApplicationStatus(author, applicationId, status, comments) {
  try {
    // Use a transaction to ensure both the update and create operations succeed or fail together.
    const updatedApplication = await prisma.$transaction(async (tx) => {
      // 1. Update the status on the main application record.
      const applicationUpdate = await tx.jobPositionApplicationHistory.update({
        where: { id: applicationId },
        data: { jobApplicationStatus: status },
      });

      // It's good practice to ensure the record existed before proceeding.
      if (!applicationUpdate) {
        throw new Error(`Application with ID ${applicationId} not found.`);
      }

      // 2. Create a new, separate record in the Comment table to log the change.
      await tx.comment.create({
        data: {
          foreignTableName: 'JobPositionApplicationHistory', // The table this comment relates to
          author: author,                                 // The user who made the change
          foreignKey: String(applicationId),              // The specific record ID
          status: status,                                 // The new status being set
          comment: comments,                              // The comment text
          timestamp: new Date(),                          // The current timestamp
        },
      });

      // Return the updated application record from the transaction.
      return applicationUpdate;
    });

    return updatedApplication;
  } catch (error) {
    console.error("Error in changeCandidateApplicationStatus:", error);
    // Re-throw the error so the calling function can handle it (e.g., show an error to the user).
    throw error;
  }
}

/**
 * Get all of the semester codes that exist in the database for a given employer and their job positions.
 * @param {string} employerUsername - The username of the employer to retrieve job positions for.
 * @returns {Promise<Array>} A promise that resolves to an array of unique semester codes.
 */
async function getSemesterCodesForEmployer(employerUsername) {
  const positions = await prisma.jobPosition.findMany({
    where: { username: employerUsername },
    select: { semesterCode: true },
    distinct: ["semesterCode"],
  });
  return positions.map((position) => position.semesterCode);
}

// -- Private Helper Functions for Application Search --

/**
 * Builds the WHERE clause for the main JobPosition query based on user-Interview filters.
 * This function handles filters that apply directly to the JobPosition model itself.
 * @param {object} filters - The filter criteria from the client (e.g., level, semester, hasApplications).
 * @returns {object} A Prisma WHERE clause object for the JobPosition model.
 */
function buildJobPositionForApplicationFilterClause(filters) {
  const where = {};
  if (!filters) {
    return where;
  }

  // Add "Course Level" filter (e.g., "100-level", "200-level").
  if (
    filters.level &&
    Array.isArray(filters.level) &&
    filters.level.length > 0
  ) {
    const levelConditions = filters.level.map((levelString) => {
      // Extracts the first digit from strings like "100-level" -> "1"
      const levelDigit = levelString.replace("-level", "").charAt(0);
      return {
        courseCode: {
          contains: `-${levelDigit}`,
        },
      };
    });

    // Add the OR conditions to the main filter clause.
    where.OR = levelConditions;
  }

  // Filter by semester code
  if (filters.semester) {
    where.semesterCode = parseInt(filters.semester, 10);
  }

  // Filter if a employer member has applications for a position (yes/no/any)
  if (filters.hasApplications) {
    if (filters.hasApplications.toLowerCase() === "yes") {
      where.jobPositionApplicationHistory = { some: {} };
    } else if (filters.hasApplications.toLowerCase() === "no") {
      where.jobPositionApplicationHistory = { none: {} };
    }
  }

  return where;
}

/**
 * Builds the WHERE clause for the nested JobPositionApplicationHistory query.
 * This is used to filter the applications *within* each job position that is returned.
 * @param {object} filters - The filter criteria from the client (e.g., status).
 * @returns {object} A Prisma WHERE clause for the JobPositionApplicationHistory model.
 */
function buildApplicationFilterClause(filters) {
  const where = { AND: [] };
  // Filter by application status
  if (
    filters?.status &&
    Array.isArray(filters.status) &&
    filters.status.length > 0
  ) {
    const statusEnums = filters.status
      .map((s) => applicationStatusStringToEnum[s])
      .filter(Boolean);
    if (statusEnums.length > 0) {
      where.AND.push({ jobApplicationStatus: { in: statusEnums } });
    }
  }

  return where.AND.length > 0 ? where : {};
}

// -- Public Functions for Application Search --

/**
 * Queries the database to retrieve job positions and their applications for a specific candidate/employee based on search and filter criteria.
 * @param {string} searchTerm - The text to search for.
 * @param {object} filters - The filter criteria (status, level, semester).
 * @param {string} candidateUsername - The unique identifier of the candidate.
 * @returns A promise that resolves to an array of Application objects.
 */
async function getCandidateApplications(searchTerm, filters, candidateUsername) {
  const jobPositionFilter = buildJobPositionForApplicationFilterClause(filters);

  if (searchTerm && searchTerm.trim()) {
    jobPositionFilter.OR = [
      { course: { name: { contains: searchTerm } } },
      { courseCode: { contains: searchTerm } },
    ];
  }

  const applicationFilter = buildApplicationFilterClause(filters);

  const finalWhereClause = {
    ...applicationFilter,
    username: candidateUsername,
    jobPosition: jobPositionFilter,
  };

  const applications = await prisma.jobPositionApplicationHistory.findMany({
    where: finalWhereClause,
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

  const filteredApplications = applications.filter((app) => app.jobPosition);

  return filteredApplications;
}

/**
 * Retrieves and Searches and filters job positions and their applications for a specific employer.
 * The primary query is on the JobPosition model to allow for viewing all positions.
 * @param {string} searchTerm - The text to search for.
 * @param {string} searchBy - The context of the search ('course' or 'student').
 * @param {object} filters - The filter criteria (status, level, semester, hasApplications).
 * @param {number} employerUsername - The unique identifier of the employer.
 * @returns {Promise<Array>} A promise that resolves to an array of Application objects under the jobPositions of the employer.
 */
async function getCandidateApplicationsAsEmployer(
  searchTerm,
  searchBy,
  filters,
  employerUsername
) {
  const positionWhereClause =
    buildJobPositionForApplicationFilterClause(filters);
  positionWhereClause.username = employerUsername;

  const nestedApplicationWhereClause = buildApplicationFilterClause(filters);

  // Conditionally apply the search term based on the 'searchBy' parameter.
  if (searchTerm && searchTerm.trim()) {
    const trimmedSearchTerm = searchTerm.trim();

    if (searchBy === "course") {
      // If searching by course, add the OR condition to the main position query.
      positionWhereClause.OR = [
        { course: { name: { contains: trimmedSearchTerm } } },
        { course: { courseCode: { contains: trimmedSearchTerm } } },
      ];
    } else if (searchBy === 'student') {
      // Split the search term by spaces to handle first and last names.
      const nameParts = trimmedSearchTerm.split(' ').filter(part => part);

      // Build a condition that requires each part of the name to be present in either the first or last name field.
      // This handles "Jane Doe", "Doe Jane", "Jane", and "Doe" searches gracefully.
      const studentNameCondition = {
        AND: nameParts.map(part => ({
          OR: [
            { candidateFName: { contains: part } },
            { candidateLName: { contains: part } },
          ],
        })),
      };

      // Filter the top-level positions to only those that have an application matching the name.
      positionWhereClause.jobPositionApplicationHistory = {
        some: studentNameCondition,
      };

      // Filter the included applications to only show the ones matching the name.
      if (!nestedApplicationWhereClause.AND) {
        nestedApplicationWhereClause.AND = [];
      }
      nestedApplicationWhereClause.AND.push(studentNameCondition);
    }
  }

  // Perform the main query
  const positions = await prisma.jobPosition.findMany({
    where: positionWhereClause,
    include: {
      course: {
        select: { name: true, description: true },
      },
      jobPositionApplicationHistory: {
        where: nestedApplicationWhereClause,
        include: {
          resume: {
            select: { name: true, resumeURL: true },
          },
        },
      },
    },
  });

  return positions;
}

// =============================================================================
// USER & PROFILE MANAGEMENT
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
 * Retrieves a user by their username.
 * @param {string} username - The unique identifier of the user.
 * @returns {Promise<object|null>} A promise that resolves to the user object, or null if not found.
 */
async function getUser(username) {
  try {
    const user = await prisma.user.findUnique({ where: { username: username } });

    if (!user) {
      return null;
    }

    // Destructure the user object to separate the password from the rest of the fields
    const { password, ...userWithoutPassword } = user;

    // Return the object containing all other fields
    return userWithoutPassword;

  } catch (error) {
    console.error('Error retrieving user:', error);
    throw error;
  }
}

/**
 * Authenticates a user based on their username and password.
 * @param {string} username - The username of the user.
 * @param {string} password - The password of the user.
 * @returns {Promise<object>} A promise that resolves to the authenticated user object.
 */
async function authenticateUser(username, password) {
  try {
    const user = await prisma.user.findFirst({
      where: { username: username }
    });

    if (!user) {
      // User not found
      return null;
    }

    // Verify the password using our new function
    const isPasswordCorrect = await verifyPassword(password, user.password);

    if (isPasswordCorrect) {
      const { password,...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  } catch (error) {
    console.error('Error authenticating user:', error);
    throw error;
  }
}

/**
 * Resets a user's password
 * @param {string} username - The username of the user.
 * @param {string} newPassword - The new password to set.
 * @returns {Promise<object>} A promise that resolves to the updated user object.
 * @throws Will throw an error if the token is invalid or expired.
 */
async function resetPassword(username, newPassword) {
  const user = await prisma.user.findUnique({ where: { username } });

  // If the user exists, proceed with the password update and return the updated without the password
  if (user) {
    const newHashedPassword = await hashPassword(newPassword);
    return prisma.user.update({
      where: { username: username },
      data: { password: newHashedPassword },
      select: {
        uid: true,
        fname: true,
        lname: true,
        username: true,
        email: true,
        pronouns: true,
        role: true
      }
    });
  }
  
  // If user doesn't exist, do nothing. This prevents username discovery.
  return null;
}

/**
 * Retrieves a unique user's profile, including role-specific details (e.g., candidate or employer info).
 * @param {string} username - The unique identifier of the user.
 * @returns {Promise<object|null>} A promise that resolves to the user's complete profile, or null if not found.
 */
async function getUserProfile(username) {
   try {
    const userRoleInfo = await prisma.user.findUnique({
      where: { username: username },
      select: { role: true },
    });

    if (!userRoleInfo) return null;

    let fullProfile;

    // If the user is a Candidate or Employee, fetch their detailed candidate profile.
    if (userRoleInfo.role === "CANDIDATE" || userRoleInfo.role === "EMPLOYEE") {
      fullProfile = await prisma.user.findUnique({
        where: { username: username },
        include: {
          candidate: {
            include: {
              resumes: true,
              courseHistory: { include: { course: true } },
              jobPositionApplicationHistory: { include: { jobPosition: true } },
              employee: {
                include: {
                  jobPositionHistory: true,
                }
              }
            },
          },
        },
      });
    }
    // If the user is an Employer or Admin, fetch their detailed employer profile.
    else if (userRoleInfo.role === "EMPLOYER" || userRoleInfo.role === "ADMIN") {
      fullProfile = await prisma.user.findUnique({
        where: { username: username },
        include: {
          employer: {
            include: {
              jobPostions: { include: { course: true, jobSchedules: true } },
            },
          },
        },
      });
    }
    // For any other role, just get the basic user data.
    else {
      fullProfile = getUser(username);
    }

    // If for any reason the full profile wasn't found, return null.
    if (!fullProfile) return null;

    // Before returning, remove the password from the final object.
    const { password, ...profileWithoutPassword } = fullProfile;
    return profileWithoutPassword;

  } catch (error) {
    console.error("Error finding user profile:", error);
    throw error;
  }
}

/**
 * Creates a new candidate user profile in a single transaction.
 * @param {object} candidateData - The complete data for the new candidate.
 * @returns {Promise<object>} The newly created candidate profile, without the password.
 */
async function createCandidateProfile(candidateData) {
  try {
    // Password is required for creation, so we hash it.
    const hashedPassword = await hashPassword(candidateData.password);

    const profile = await prisma.$transaction(async (tx) => {
      // 1. Create the base User record.
      await tx.user.create({
        data: {
          uid: candidateData.uid,
          fname: candidateData.fname,
          lname: candidateData.lname,
          username: candidateData.username,
          password: hashedPassword,
          email: candidateData.email,
          pronouns: candidateData.pronouns,
          role: candidateData.role,
        },
      });

      // 2. Create the associated Candidate record.
      await tx.candidate.create({
        data: {
          username: candidateData.username,
          year: candidateData.year,
          major: candidateData.major,
          graduateStatus: candidateData.graduateStatus,
          wasPriorEmployee: candidateData.wasPriorEmployee || false,
        },
      });

      // 3. Create Course History entries, if provided.
      if (candidateData.courseHistory && candidateData.courseHistory.length > 0) {
        await tx.courseHistory.createMany({
          data: candidateData.courseHistory.map((course) => ({
            username: candidateData.username,
            courseCode: course.courseCode,
            grade: course.grade,
            hasTaken: course.hasTaken || false,
            wasPriorEmployee: course.wasPriorEmployee || false,
          })),
        });
      }

      // 4. Return the complete profile.
      return tx.user.findUnique({
        where: { username: candidateData.username },
        include: {
          candidate: { include: { courseHistory: true } },
        },
      });
    });

    // 5. Securely remove the password before returning.
    if (!profile) return null;
    const { password, ...profileWithoutPassword } = profile;
    return profileWithoutPassword;

  } catch (error) {
    console.error("Error in createCandidateProfile:", error);
    throw error;
  }
}

/**
 * Updates an existing candidate's or employee's profile in a single transaction.
 * @param {object} candidateData - The data to update for the candidate. Must include uid.
 * @returns {Promise<object>} The updated candidate profile, without the password.
 */
async function updateCandidateProfile(candidateData) {
  try {
    const updatePayload = { ...candidateData };

    // Conditionally hash a new password only if one is provided.
    if (updatePayload.password) {
      updatePayload.password = await hashPassword(updatePayload.password);
    }

    const profile = await prisma.$transaction(async (tx) => {
      // 1. Update the base User record. Username is not updatable.
      await tx.user.update({
        where: { username: updatePayload.username },
        data: {
          fname: updatePayload.fname,
          lname: updatePayload.lname,
          email: updatePayload.email,
          pronouns: updatePayload.pronouns,
          uid: updatePayload.uid,
          role: updatePayload.role,
          // Only include password in the update if it was changed.
          ...(updatePayload.password && { password: updatePayload.password }),
        },
      });

      // 2. Update the associated Candidate record.
      await tx.candidate.update({
        where: { username: updatePayload.username },
        data: {
          year: updatePayload.year,
          major: updatePayload.major,
          graduateStatus: updatePayload.graduateStatus,
          wasPriorEmployee: updatePayload.wasPriorEmployee,
        },
      });

      // 3. Handle Course History (replace all existing entries).
      if (updatePayload.courseHistory) {
        await tx.courseHistory.deleteMany({ where: { username: updatePayload.username } });
        if (updatePayload.courseHistory.length > 0) {
          await tx.courseHistory.createMany({
            data: updatePayload.courseHistory.map((course) => ({
              username: updatePayload.username,
              courseCode: course.courseCode,
              grade: course.grade,
              hasTaken: course.hasTaken || false,
              wasPriorEmployee: course.wasPriorEmployee || false,
            })),
          });
        }
      }
      
      // 4. Return the complete profile.
      return tx.user.findUnique({
        where: { username: updatePayload.username },
        include: {
          candidate: { include: { courseHistory: true } },
        },
      });
    });

    // 5. Securely remove the password before returning.
    if (!profile) return null;
    const { password, ...profileWithoutPassword } = profile;
    return profileWithoutPassword;

  } catch (error) {
    console.error("Error in updateCandidateProfile:", error);
    throw error;
  }
}

/**
 * Creates a new employer and admin user profile in a single transaction.
 * @param {object} employerData - The complete data for the new employer.
 * @returns {Promise<object>} The newly created employer profile, without the password.
 */
async function createEmployerProfile(employerData) {
  try {
    const hashedPassword = await hashPassword(employerData.password);

    const profile = await prisma.$transaction(async (tx) => {
      // 1. Create the base User record.
      await tx.user.create({
        data: {
          uid: employerData.uid,
          fname: employerData.fname,
          lname: employerData.lname,
          username: employerData.username,
          password: hashedPassword,
          email: employerData.email,
          pronouns: employerData.pronouns,
          role: employerData.role,
        },
      });

      // 2. Create the associated Employer record.
      await tx.employer.create({
        data: {
          username: employerData.username,
          department: employerData.department,
        },
      });

      // 3. Return the complete profile.
      return tx.user.findUnique({ where: { username: employerData.username } });
    });

    // 4. Securely remove the password before returning.
    if (!profile) return null;
    const { password, ...profileWithoutPassword } = profile;
    return profileWithoutPassword;

  } catch (error) {
    console.error("Error in createEmployerProfile:", error);
    throw error;
  }
}


/**
 * Updates an existing employer's profile in a single transaction.
 * @param {object} employerData - The data to update for the employer.
 * @returns {Promise<object>} The updated employer profile, without the password.
 */
async function updateEmployerProfile(employerData) {
  try {
    const updatePayload = { ...employerData };
    
    // Conditionally hash a new password only if one is provided.
    if (updatePayload.password) {
      updatePayload.password = await hashPassword(updatePayload.password);
    }

    const profile = await prisma.$transaction(async (tx) => {
      // 1. Update the base User record.
      await tx.user.update({
        where: { username: updatePayload.username },
        data: {
          fname: updatePayload.fname,
          lname: updatePayload.lname,
          email: updatePayload.email,
          pronouns: updatePayload.pronouns,
          uid: updatePayload.uid,
          role: updatePayload.role,
          ...(updatePayload.password && { password: updatePayload.password }),
        },
      });

      // 2. Update the associated Employer record.
      await tx.employer.update({
        where: { username: updatePayload.username },
        data: { department: updatePayload.department },
      });

      // 3. Return the complete profile.
      return tx.user.findUnique({ where: { username: updatePayload.username } });
    });

    // 4. Securely remove the password before returning.
    if (!profile) return null;
    const { password, ...profileWithoutPassword } = profile;
    return profileWithoutPassword;

  } catch (error) {
    console.error("Error in updateEmployerProfile:", error);
    throw error;
  }
}

/**
 * Terminates all of an employee's active job positions and marks their records as TERMINATED.
 * @param {string} username - The username of the employee to terminate.
 * @returns {Promise<object>} The updated user profile after termination.
 */
async function terminateEmployee(username) {
  try {
    return await prisma.$transaction(async (tx) => {
      // 1. Find all employee records associated with the username.
      // An employee can have multiple roles/entries in the Employee table over time.
      const employeeRecords = await tx.employee.findMany({
        where: { username: username },
      });

      if (employeeRecords.length === 0) {
        throw new Error(`No employee records found for username ${username}`);
      }
      
      // Get a list of all internal employee IDs for this user
      const employeeDbIds = employeeRecords.map(emp => emp.id);

      // 2. Update all associated JobPositionHistory entries to TERMINATED.
      await tx.jobPositionHistory.updateMany({
        where: {
          employeeId: { in: employeeDbIds },
          jobPositionHistoryStatus: { in: ['ACTIVE', 'INACTIVE'] }
        },
        data: {
          jobPositionHistoryStatus: "TERMINATED",
        },
      });

      // 3. Update all of the employee's statuses in the Employee table to TERMINATED.
      await tx.employee.updateMany({
        where: {
          username: username,
        },
        data: {
          employeeStatus: "TERMINATED",
        },
      });

      // 4. Return the fully updated user profile for confirmation.
      return tx.user.findUnique({
        where: { username: username },
        include: {
          candidate: {
            include: {
              employee: true,
              jobPositionApplicationHistory: true,
            },
          },
        },
      });
    });
  } catch (error) {
    console.error(`Error in terminateEmployee for user ${username}:`, error);
    throw error;
  }
}

// =============================================================================
// RESUME QUERIES
// =============================================================================

/**
 * Adds a new resume for a candidate.
 * @param {string} username - The unique identifier of the candidate.
 * @param {string} resumeURL - The URL of the candidate's resume.
 * @param {boolean} isPrimary - Whether the resume is the primary resume for the candidate.
 * @param {string} name - The name of the resume.
 * @returns {Promise<object>} A promise that resolves to the newly created resume record.
 */
async function addNewCandidateResume(username, isPrimary, resumeURL, name) {
  try {
    return await prisma.resume.create({
      data: {
        username: username,
        isPrimary: isPrimary,
        resumeURL: resumeURL,
        name: name,
      },
    });
  } catch (error) {
    console.error("Error adding new resume:", error);
    throw error;
  }
}

/**
 * Updates a specific resume for a candidate.
 * @param {number} resumeId - The unique identifier of the resume to update.
 * @param {string} name - The name of the resume.
 * @returns {Promise<object>} A promise that resolves to the updated resume record.
 */
async function updateResumeName(resumeId, name) {
  try {
    return await prisma.resume.update({
      where: {
        id: resumeId,
      },
      data: {
        name: name,
      },
    });
  } catch (error) {
    console.error("Error updating resume:", error);
    throw error;
  }
}

/**
 * Sets a specific resume as the primary one for a candidate.
 * @param {string} candidateUsername - The unique identifier of the candidate.
 * @param {number} resumeId - The unique identifier of the resume to set as primary.
 * @returns {Promise<object>} A promise that resolves to the updated resume record.
 */
async function updatePrimaryResume(candidateUsername, resumeId) {
  try {
    // Use a transaction to ensure both operations succeed or fail together
    return await prisma.$transaction(async (tx) => {
      // Step 1: Set all of the candidate's resumes to non-primary
      await resetResumesToNonPrimary(candidateUsername);

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
    console.error("Error updating primary resume:", error);
    throw error;
  }
}

/**
 * Gets all resumes for a candidate.
 * @param {string} candidateUsername - The unique identifier of the candidate.
 * @returns {Promise<object>} A promise that resolves to an array of resume records.
 */
async function getCandidateResumes(candidateUsername) {
  try {
    return await prisma.resume.findMany({
      where: {
        username: candidateUsername,
      },
    });
  } catch (error) {
    console.error("Error retrieving resumes:", error);
    throw error;
  }
}

/**
 * Resets all resumes for a candidate to non-primary status.
 * @param {string} candidateUsername - The unique identifier of the candidate.
 * @returns {Promise<object>} A promise that resolves to the result of the update operation.
 */
async function resetResumesToNonPrimary(candidateUsername) {
  try {
    return await prisma.resume.updateMany({
      where: {
        username: candidateUsername,
        isPrimary: true,
      },
      data: {
        isPrimary: false,
      },
    });
  } catch (error) {
    console.error("Error resetting resumes to non-primary:", error);
    throw error;
  }
}

/**
 * Deletes a resume by its ID.
 * If the deleted resume was primary, it promotes another resume to primary.
 * @param {number} resumeId The ID of the resume to delete.
 * @returns {Promise<object>} The deleted resume object.
 */
async function deleteResume(resumeId) {
  try {
    return prisma.$transaction(async (tx) => {
      // Find if the resume is associated with a job application.
      const associatedApplication =
        await tx.jobPositionApplicationHistory.findFirst({
          where: { resumeId: resumeId },
        });

      // If an application uses this resume, throw a specific error
      if (associatedApplication) {
        throw new Error("DELETE_FAILED_ASSOCIATED");
      }

      // Find the resume to be deleted.
      const resumeToDelete = await tx.resume.findUnique({
        where: { id: resumeId },
      });

      if (!resumeToDelete) {
        throw new Error("Resume not found.");
      }

      // If the resume was primary, find and promote a new one.
      if (resumeToDelete.isPrimary) {
        const otherResumes = await tx.resume.findMany({
          where: {
            username: resumeToDelete.username,
            id: { not: resumeId }, // Find all OTHER resumes for this user
          },
        });

        // If other resumes exist, make the your most recent one primary.
        if (otherResumes.length > 0) {
          await tx.resume.update({
            where: { id: otherResumes[otherResumes.length - 1].id },
            data: { isPrimary: true },
          });
        }
      }

      // Delete the actual resume record.
      const deletedResume = await tx.resume.delete({
        where: { id: resumeId },
      });

      return deletedResume;
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    throw error;
  }
}

// =============================================================================
// GENERAL & UTILITY QUERIES
// =============================================================================

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

/**
 * Creates a new course in the database.
 * @param {object} courseData - An object containing the course code, name, and description.
 * @returns {Promise<object>} A promise that resolves to the created course object.
 */
async function createCourse(courseData) {
  const { courseCode, name, description } = courseData;
  try {
    return await prisma.course.create({
      data: {
        courseCode: courseCode,
        name: name,
        description: description,
      },
    });
  } catch (error) {
    console.error("Error creating course:", error);
    throw error;
  }
}

/**
 * Retrieves all comments for a specific record.
 * @param {string} tableName - The name of the table the comments are associated with.
 * @param {string|number} foreignKey - The ID of the record the comments are associated with.
 * @returns {Promise<object>} A promise that resolves to an array of comment objects.
 */
async function getComments(tableName, foreignKey) {
  try {
    const comments = await prisma.comment.findMany({
      where: { foreignTableName: tableName, foreignKey: foreignKey },
    });
    return comments;
  } catch (error) {
    console.error("Error in getComments:", error);
    throw error;
  }
}

// =============================================================================
// TIMECARD MANAGEMENT
// =============================================================================

/**
 * Creates or updates an employee's weekly timecard by individually
 * upserting each day's entry. This is a non-destructive operation.
 * @param {object} timecardData - The data submitted from the frontend.
 */
async function upsertTimecard(timecardData) {
  const { jobPositionHistoryId, entries, weekStartDate, isCurrentWeek } = timecardData;

  return prisma.$transaction(async (tx) => {
    const jobHistory = await tx.jobPositionHistory.findUnique({
      where: { id: jobPositionHistoryId },
      select: { employeeId: true },
    });
    if (!jobHistory) {
      throw new Error(`JobPositionHistory with ID ${jobPositionHistoryId} not found.`);
    }
    const { employeeId } = jobHistory;

    // Find or create the weekly container
    let weeklyHistory = await tx.timecardWeeklyHistory.findFirst({
        where: { jobPositionHistoryId, weekStartDate }
    });

    if (!weeklyHistory) {
        weeklyHistory = await tx.timecardWeeklyHistory.create({
            data: { jobPositionHistoryId, weekStartDate, isCurrentWeek: true }
        });
    } else if (isCurrentWeek) {
        // Ensure this week is marked as current if it's being submitted
        await tx.timecardWeeklyHistory.update({
            where: { id: weeklyHistory.id },
            data: { isCurrentWeek: true },
        });
    }

    // Helper to convert time strings to Date objects
    const createDate = (d, time) => time ? new Date(`${d}T${time}:00Z`) : null;

    // Loop through each day and upsert it individually
    for (const entry of entries) {
        const dayId = `${employeeId}-${entry.date}`;
        const dataToUpsert = {
            notes: entry.notes,
            duration: entry.duration,
            timeIn1: createDate(entry.date, entry.timeIn1),
            timeOut1: createDate(entry.date, entry.timeOut1),
            timeIn2: createDate(entry.date, entry.timeIn2),
            timeOut2: createDate(entry.date, entry.timeOut2),
            timeIn3: createDate(entry.date, entry.timeIn3),
            timeOut3: createDate(entry.date, entry.timeOut3),
        };

        await tx.timecardDay.upsert({
            where: { id: dayId },
            update: dataToUpsert,
            create: {
                id: dayId,
                day: new Date(entry.date),
                timecardWeeklyHistoryId: weeklyHistory.id,
                ...dataToUpsert
            },
        });
    }

    return { success: true, message: 'Timecard saved successfully.' };
  });
}

/**
 * Retrieves all weekly timecards for a specific job.
 * @param {number} jobPositionHistoryId - The ID of the employee's specific job history record.
 * @returns {Promise<Array>} A promise that resolves to an array of all timecard objects.
 */
async function getAllTimecardsForJob(jobPositionHistoryId) {
  try {
    return await prisma.timecardWeeklyHistory.findMany({
      where: {
        jobPositionHistoryId: jobPositionHistoryId,
      },
      include: {
        dailyEntries: {
          orderBy: {
            day: 'asc',
          },
        },
      },
      orderBy: {
        weekStartDate: 'desc',
      },
    });
  } catch (error) {
    console.error(`Error fetching all timecards for job ${jobPositionHistoryId}:`, error);
    throw error;
  }
}

/**
 * For the Admin View: Retrieves all timecards from all users.
 * Navigates through the new schema to include the user's first and last name.
 * @returns {Promise<Array>} A promise resolving to a flat array of all timecard records.
 */
async function fetchAdminViewData() {
  try {
    return await prisma.timecardWeeklyHistory.findMany({
      include: {
        dailyEntries: {
          orderBy: { day: 'asc' },
        },
        jobPositionHistory: {
          include: {
            employee: {
              include: {
                candidate: {
                  include: {
                    user: {
                      select: {
                        username: true,
                        fname: true,
                        lname: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        weekStartDate: 'desc',
      },
    });
  } catch (error) {
    console.error(`Error fetching admin timecard data:`, error);
    throw error;
  }
}

/**
 * For the Employer View: Retrieves all timecards for a specific employer's employees.
 * @param {string} employerUsername - The RIT username of the employer.
 * @returns {Promise<Array>} A promise resolving to a flat array of timecard records for that employer.
 */
async function fetchEmployerViewData(employerUsername) {
  try {
    return await prisma.timecardWeeklyHistory.findMany({
      where: {
        jobPositionHistory: {
          jobPosition: {
            username: employerUsername,
          },
          employee: {
            employeeStatus: 'ACTIVE',
          },
        },
      },
      include: {
        dailyEntries: {
          orderBy: { day: 'asc' },
        },
        jobPositionHistory: {
          include: {
            jobPosition: { select: { courseCode: true, sectionNumber: true } },
            employee: {
              include: {
                candidate: {
                  include: {
                    user: {
                      select: {
                        username: true,
                        fname: true,
                        lname: true
                      }
                    }
                  }
                }
              }
            }
          }
        }
      },
      orderBy: {
        weekStartDate: 'desc',
      },
    });
  } catch (error)
  {
    console.error(`Error fetching employer timecard data for employer ${employerUsername}:`, error);
    throw error;
  }
}

// =============================================================================
// EXPORTS & PROCESS HANDLING
// =============================================================================

module.exports = {
  getOpenJobPositions,
  getJobPositionsByStatus,
  getCandidateApplicationsAsEmployer,
  getCandidateApplications,
  deleteCandidateApplication,
  getCandidateApplication,
  getSemesterCodesForEmployer,
  applyForJobPosition,
  getCandidateHiredStatus,
  changeCandidateApplicationStatus,
  getUser,
  authenticateUser,
  resetPassword,
  getUserProfile,
  createCandidateProfile,
  updateCandidateProfile,
  createEmployerProfile,
  updateEmployerProfile,
  addNewCandidateResume,
  updatePrimaryResume,
  deleteResume,
  updateResumeName,
  getCandidateResumes,
  getAllUsers,
  getAllCourses,
  modifyPosition,
  createPosition,
  getAllPositions,
  createCourse,
  getComments,
  terminateEmployee,
  upsertTimecard,
  getAllTimecardsForJob,
  fetchAdminViewData,
  fetchEmployerViewData,
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

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
const { create } = require("domain");
const { get } = require("http");
const { applicationStatusStringToEnum } = require('../constants/status');

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
 * @param {number} candidateUID - The UID of the candidate to check "applied" status against.
 * @returns {Promise<object>} A promise that resolves to an object containing the filter `where` clause and fetched candidate data.
 */
async function buildPositionFilterClause(filters, candidateUID) {
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
    filterWhere.courseCode = {
      contains: `-${filters.level.charAt(0)}`,
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
          maxCAs: jobData.maxCAs,
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
 * @returns {Promise<object>} The newly created JobPosition object with all relations.
 */
async function createPosition(positionData, EmployerUID) {
  const { jobSchedules, ...jobData } = positionData;
  //Check if positionID already exists
  // The unique ID is a combination of semester, course, and section.
  const newJobId = `${jobData.semesterCode}-${jobData.courseCode}-${jobData.sectionNumber}`;
  console.log("Created for employer: ", EmployerUID);

  try {
    console.log("backend called for employer: ", EmployerUID);
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
          connect: { uid: EmployerUID }
        },        maxCAs: jobData.maxCAs,
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
 * Searches and filters open job positions based on a search term and a set of filters.
 * @param {string} searchTerm - The text to search for in course names and codes.
 * @param {object} filters - The filter criteria (eligibility, days, level, location, applied).
 * @param {number} candidateUID - The UID of the viewing candidate, used for "applied" and "eligibility" checks.
 * @returns {Promise<Array>} A promise that resolves to an array of filtered and processed job positions.
 */
async function getOpenJobPositions(
  searchTerm,
  filters,
  candidateUID
) {
  try {
    // 1. Build the search and filter clauses separately.
    const searchWhere = buildPositionSearchClause(searchTerm);
    const { filterWhere, candidateData } = await buildPositionFilterClause(
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
    // Add a default job position status filter to show only OPEN positions.
    finalWhere.jobPositionStatus = 'OPEN';

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
          name: 'asc',
        },
      },
    });

    // 4. Perform post-query filtering for "Eligibility" as it requires complex logic on fetched data.
    if (filters.eligibility && filters.eligibility !== 'Any' && candidateData) {
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
        return filters.eligibility === 'Eligible' ? isEligible : !isEligible;
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
  } catch (error) {
    console.error('Error in getOpenJobPositions:', error);
    throw error;
  }
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
    const {
      candidateUID,
      jobPositionId,
      resumeId,
      jobPositionApplicationFormData,
    } = applicationDetails;

    // 1. Validate required fields.
    if (
      
      !candidateUID ||
     
      !jobPositionId ||
     
      !resumeId ||
     
      !jobPositionApplicationFormData
    
    ) {
      throw new Error(
        "Missing required fields: candidate UID, job position ID, resume ID, or form data."
      );
    }

    // 2. Verify that the candidate, job position, and resume exist.
    const [candidate, jobPosition, resume] = await Promise.all([
      prisma.candidate.findUnique({ where: { uid: candidateUID } }),
      prisma.jobPosition.findUnique({ where: { id: jobPositionId } }),
      prisma.resume.findFirst({
        where: { id: resumeId, candidateUID: candidateUID },
      }),
    ]);
    if (!candidate)
      throw new Error(`Candidate with UID ${candidateUID} not found.`);
    if (!jobPosition)
      throw new Error(`Job Position with ID ${jobPositionId} not found.`);
    if (!resume)
      throw new Error(
        `Resume with ID ${resumeId} not found for this candidate.`
      );

    // 3. Check if the candidate has already applied.
    const existingApplication =
      await prisma.jobPositionApplicationHistory.findFirst({
        where: { candidateUID, jobPositionId },
      });
    if (existingApplication) {
      throw new Error(
        'This candidate has already applied for this job position.'
      );
    }
    const applicationFormData = JSON.parse(jobPositionApplicationFormData);

    // 4. Create the new application record.
    const newApplication = await prisma.jobPositionApplicationHistory.create({
      data: {
        candidateUID,
        jobPositionId,
        resumeId: resumeId,
        candidateName: applicationFormData.name,
        candidateEmail: applicationFormData.email,
        candidateMajor: applicationFormData.major,
        candidateYear: parseInt(applicationFormData.year, 10),
        candidateGrade: letterToGradeEnum[applicationFormData.grade],
        wasPriorEmployeeForThisCourse: applicationFormData.wasPriorEmployeeForThisCourse,
        wasPriorEmployeeForOtherCourses: applicationFormData.wasPriorEmployeeForOtherCourses,
        priorEmploymentHistory: applicationFormData.priorEmploymentHistory
        ?.map(item => item.courseCode)
        .join(', '),
      },
    });

    // 5. Create a comment record for the new application.
    await prisma.comment.create({
        data: {
          foreignTableName: 'JobPositionApplicationHistory',
          foreignKey: String(newApplication.id), // Use the ID from the just-created application
          status: 'APPLIED',                 // The initial status
          comment: 'Candidate submitted application.', // A system-generated comment
          timestamp: new Date(),
        },
      });

    // 6. Update the candidate's course history with the self-reported grade.
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
 * Deletes a candidate's application and its entire comment history.
 * The combination of candidateUID and jobPositionId must be unique.
 * @param {number} candidateUID - The UID of the candidate.
 * @param {string} jobPositionId - The ID of the job position.
 * @returns {Promise<object>} A promise that resolves to the deleted application record.
 */
async function deleteCandidateApplication(candidateUID, jobPositionId) {
  try {
    // Find the application to get its unique ID. This is done outside the
    // transaction because we need the ID to identify which comments to delete.
    const applicationToDelete =
      await prisma.jobPositionApplicationHistory.findFirst({
        where: {
          candidateUID: candidateUID,
          jobPositionId: jobPositionId,
        },
        select: { id: true }, // We only need the primary key.
      });

    if (!applicationToDelete) {
      throw new Error(
        'Application not found for the specified candidate and job position.'
      );
    }

    const applicationId = applicationToDelete.id;

    // Use a transaction to ensure both deletions succeed or fail together.
    const result = await prisma.$transaction(async (tx) => {
      // First, delete all comments associated with this application.
      await tx.comment.deleteMany({
        where: {
          foreignTableName: 'JobPositionApplicationHistory',
          foreignKey: String(applicationId),
        },
      });

      // Second, delete the application record itself.
      const deletedApplication = await tx.jobPositionApplicationHistory.delete({
        where: {
          id: applicationId,
        },
      });

      return deletedApplication;
    });

    return result;
    
  } catch (error){
    console.error('Error in deleteCandidateApplication:', error);
    throw error;
  }
}

/**
 * Retrieves all candidate applications for a specific candidate/employee.
 * @param {number} UID - The UID of the candidate/employee.
 * @returns {Promise<object>} A promise that resolves to an object of applications, grouped by job position ID.
 */



/**
 * Updates an application's status and creates a new comment record in a transaction.
 * @param {string} applicationId - The ID of the JobPositionApplicationHistory record.
 * @param {string} status - The new status for the application (e.g., 'Rejected', 'Accepted').
 * @param {string} comments - The text for the new comment record.
 * @returns {Promise<object>} The updated application record.
 */
async function changeCandidateApplicationStatus(applicationId, status, comments) {
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
    console.error('Error in changeCandidateApplicationStatus:', error);
    // Re-throw the error so the calling function can handle it (e.g., show an error to the user).
    throw error;
  }
}

/**
 * Get all of the semester codes that exist in the database for a given employer and their job positions.
 * @param {number} employerUID - The UID of the employer.
 * @returns {Promise<Array>} A promise that resolves to an array of unique semester codes.
 */
async function getSemesterCodesForEmployer(employerUID) {
  const positions = await prisma.jobPosition.findMany({
    where: { employerUID },
    select: { semesterCode: true },
    distinct: ['semesterCode'],
  });
  return positions.map(position => position.semesterCode);
}

// -- Private Helper Functions for Application Search --

/**
 * Builds the WHERE clause for the main JobPosition query based on user-selected filters.
 * This function handles filters that apply directly to the JobPosition model itself.
 * @param {object} filters - The filter criteria from the client (e.g., level, semester, hasApplications).
 * @returns {object} A Prisma WHERE clause object for the JobPosition model.
 */
function buildJobPositionForApplicationFilterClause(filters) {
  const where = {};
  if (!filters) {
    return where;
  }

  // Filter by level
  if (filters.level) {
    where.courseCode = {
      contains: `-${filters.level.charAt(0)}`,
    };
  }

  // Filter by semester code
  if (filters.semester) {
    where.semesterCode = parseInt(filters.semester, 10);
  }

  // Filter if a employer member has applications for a position (yes/no/any)
  if (filters.hasApplications) {
    if (filters.hasApplications.toLowerCase() === 'yes') {
      where.jobPositionApplicationHistory = { some: {} };
    } else if (filters.hasApplications.toLowerCase() === 'no') {
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
  if (filters?.status && Array.isArray(filters.status) && filters.status.length > 0) {
    const statusEnums = filters.status.map(s => applicationStatusStringToEnum[s]).filter(Boolean);
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
 * @param {*} candidateUID = The unique identifier of the candidate.
 * @returns A promise that resolves to an array of Application objects.
 */
async function getCandidateApplications(searchTerm, filters, candidateUID) {
  const jobPositionFilter = buildJobPositionForApplicationFilterClause(filters);

  if (searchTerm && searchTerm.trim()) {
    jobPositionFilter.OR = [
      { course: { name: { contains: searchTerm } } },
      { courseCode: { contains: searchTerm } }
    ];
  }
  
  const applicationFilter = buildApplicationFilterClause(filters);

  const finalWhereClause = {
    ...applicationFilter,
    candidateUID: candidateUID,
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

  const filteredApplications = applications.filter(app => app.jobPosition);

  const processedApplications = filteredApplications.map((application) => ({
    ...application,
    candidateGrade: gradeEnumToLetter[application.candidateGrade],
  }));

  return processedApplications;
}


/**
 * Retrieves and Searches and filters job positions and their applications for a specific employer.
 * The primary query is on the JobPosition model to allow for viewing all positions.
 * @param {string} searchTerm - The text to search for.
 * @param {string} searchBy - The context of the search ('course' or 'student').
 * @param {object} filters - The filter criteria (status, level, semester, hasApplications).
 * @param {number} employerUID - The UID of the currently logged-in employer.
 * @returns {Promise<Array>} A promise that resolves to an array of Application objects under the jobPositions of the employer.
 */
async function getCandidateApplicationsAsEmployer(searchTerm, searchBy, filters, employerUID) {
  const positionWhereClause = buildJobPositionForApplicationFilterClause(filters);
  positionWhereClause.employerUID = employerUID;

  const nestedApplicationWhereClause = buildApplicationFilterClause(filters);

  // Conditionally apply the search term based on the 'searchBy' parameter.
  if (searchTerm && searchTerm.trim()) {
    const trimmedSearchTerm = searchTerm.trim();

    if (searchBy === 'course') {
      // If searching by course, add the OR condition to the main position query.
      positionWhereClause.OR = [
          { course: { name: { contains: trimmedSearchTerm } } },
          { course: { courseCode: { contains: trimmedSearchTerm } } },
      ];
    } else if (searchBy === 'student') {
      // If searching by student, we filter in two places:
      // Filter the top-level positions to only those that have an application from the student.
      positionWhereClause.jobPositionApplicationHistory = {
        some: {
          candidateName: { contains: trimmedSearchTerm },
        }
      };
      // Filter the included applications to only show the ones from that student.
      if (!nestedApplicationWhereClause.AND) {
        nestedApplicationWhereClause.AND = [];
      }
      nestedApplicationWhereClause.AND.push({
        candidateName: { contains: trimmedSearchTerm },
      });
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
    }
  });

  const processedPositions = positions.map(position => ({
      ...position,
      jobPositionApplicationHistory: position.jobPositionApplicationHistory.map(app => ({
        ...app,
        candidateGrade: gradeEnumToLetter[app.candidateGrade],
      })),
    }));
    
  return processedPositions;
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
    console.error('Error retrieving users:', error);
    throw error;
  }
}

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

    // If the user is an Employer or Admin, fetch their detailed employer/employer profile.
    if (user.role === "EMPLOYER" || user.role === "ADMIN") {
      return prisma.user.findUnique({
        where: { uid: UID },
        include: {
          employer: {
            include: {
              jobPostions: { include: { course: true, jobSchedules: true } },
            },
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
    console.error('Error updating resume:', error);
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
    console.error('Error updating resume:', error);
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
      resetResumesToNonPrimary(candidateUID);

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
 * @param {number} candidateUID - The unique identifier of the candidate.
 * @returns {Promise<object>} A promise that resolves to an array of resume records.
 */
async function getCandidateResumes(candidateUID) {
  try {
    return await prisma.resume.findMany({
      where: {
        candidateUID: candidateUID,
      },
    });
  } catch (error) {
    console.error('Error retrieving resumes:', error);
    throw error;
  }
}

/**
 * Gets all resumes for a candidate.
 * @param {number} candidateUID - The unique identifier of the candidate.
 * @returns {Promise<object>} A promise that resolves to an array of resume records.
 */
async function getCandidateResumes(candidateUID) {
  try {
    return await prisma.resume.findMany({
      where: {
        candidateUID: candidateUID,
      },
    });
  } catch (error) {
    console.error('Error retrieving resumes:', error);
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
        throw new Error('DELETE_FAILED_ASSOCIATED');
      }

      // Find the resume to be deleted.
      const resumeToDelete = await tx.resume.findUnique({
        where: { id: resumeId },
      });

      if (!resumeToDelete) {
        throw new Error('Resume not found.');
      }

      // If the resume was primary, find and promote a new one.
      if (resumeToDelete.isPrimary) {
        const otherResumes = await tx.resume.findMany({
          where: {
            candidateUID: resumeToDelete.candidateUID,
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
    console.error('Error in getComments:', error);
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
    console.error('Error in getComments:', error);
    throw error;
  }
}

// =============================================================================
// EXPORTS & PROCESS HANDLING
// =============================================================================

module.exports = {
  getOpenJobPositions,
  getCandidateApplicationsAsEmployer,
  getCandidateApplications,
  deleteCandidateApplication,
  getSemesterCodesForEmployer,
  applyForJobPosition,
  changeCandidateApplicationStatus,
  findUniqueUser,
  upsertCandidateProfile,
  upsertEmployerProfile,
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

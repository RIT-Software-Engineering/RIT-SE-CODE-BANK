// server/server/database/query_db.js

// =============================================================================
// SETUP & INITIALIZATION
// =============================================================================

const { PrismaClient } = require("@prisma/client");
const path = require("path");
const { gradetoNumericValue } = require("../constants/grade");
const { locationMap } = require("../constants/location");
const {
  applicationStatusStringToEnum,
  positionStatusStringToEnum,
} = require("../constants/status");
const { verifyPassword, hashPassword } = require("../config/passwordHashes");
// Notifications: call the notification service directly (no shared client)
const { dispatchTemplated } = require('../utils/notifications');

// Build a stable deep link back into the TA Portal UI for CTAs in notifications.
// Uses TA_PORTAL_BASE_URL or defaults to http://localhost:3000 for dev.
// Universal landing: always send to /Applications (UI will redirect based on the logged-in user's role).
// This avoids stale links when a candidate becomes an employee, etc.
async function buildAppLink({ jobPositionId, applicationId }) {
  const base = (process.env.TA_PORTAL_BASE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const qp = new URLSearchParams();
  if (jobPositionId) qp.set('jobPositionId', String(jobPositionId));
  if (applicationId) qp.set('applicationId', String(applicationId));
  const qs = qp.toString();
  return `${base}/Applications${qs ? `?${qs}` : ''}`;
}
// Note: legacy notifyEvent shim removed — use dispatchTemplated with agnostic context exclusively.

// Ensure dotenv is loaded for DATABASE_URL if this file is ever run directly.
if (!process.env.DATABASE_URL) {
  require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
}

// Initialize Prisma Client for database interaction.
const prisma = new PrismaClient();

// Helper: normalize various input strings to the Prisma GraduateStatus enum values.
// Accepts values like 'UNDERGRAD', 'UNDERGRADUATE', 'GRAD', 'GRADUATE', etc.
function normalizeGraduateStatus(val) {
  if (val === undefined || val === null) return undefined;
  const s = String(val).trim().toUpperCase();
  if (!s) return undefined;
  if (s.startsWith('UNDER') || s === 'UG' || s === 'UNDERGRAD') return 'UNDERGRADUATE';
  if (s.startsWith('GRAD') || s === 'G') return 'GRADUATE';
  // fallback: if it already matches Prisma enum names, return as-is
  if (s === 'UNDERGRADUATE' || s === 'GRADUATE') return s;
  return undefined; // let Prisma use its default if provided
}

// =============================================================================
// JOB POSITION & APPLICATION QUERIES
// =============================================================================

// --- Private Helper Functions for Job Search ---

/**
 * Builds a search clause for job positions based on the provided search term.
 * @param {string} searchTerm - The search term to use for the search.
 * @returns {object} The search clause for the job positions.
 */
function buildPositionSearchClause(searchTerm) {
  if (!searchTerm || !searchTerm.trim()) {
    return {};
  }
  return {
    OR: [
      { course: { name: { contains: searchTerm } } },
      { course: { courseCode: { contains: searchTerm } } },
    ],
  };
}

/**
 * Builds a filter clause for the job positions based on the provided filters.
 * @param {object} filters - The filters to apply to the job positions.
 * @returns {object} The filter clause for the job positions.
 */
function buildPositionFilterClause(filters) {
  const filterWhere = {};
  // Filter by days of the week
  if (filters.days && filters.days.length > 0) {
    filterWhere.jobSchedules = { some: { dayOfWeek: { in: filters.days } } };
  }

  // Filter by level of the course (passed in as a string array)
  if (
    filters.level &&
    Array.isArray(filters.level) &&
    filters.level.length > 0
  ) {
    filterWhere.OR = filters.level.map((levelString) => ({
      courseCode: { contains: `-${levelString.charAt(0)}` },
    }));
  }

  // Filter by location
  if (filters.location && locationMap[filters.location]) {
    filterWhere.locationType = locationMap[filters.location];
  }

  // Filter by semester
  if (filters.semester) {
    filterWhere.semesterCode = parseInt(filters.semester, 10);
  }

  // Filter by status
  if (
    filters.status &&
    Array.isArray(filters.status) &&
    filters.status.length > 0
  ) {
    const statusEnums = filters.status.map(
      (s) => positionStatusStringToEnum[s]
    );
    if (statusEnums.length > 0) {
      filterWhere.jobPositionStatus = { in: statusEnums };
    }
  }

  return filterWhere;
}

// --- Main Data Fetching Function ---

/**
 * Retrieves and filters OPEN job positions, applying candidate-specific logic if a username is provided.
 * @param {string} [searchTerm=''] - The text to search for in course names and codes.
 * @param {object} [filters={}] - The filter criteria (eligibility, days, semester, level, location, applied).
 * @param {string|null} [candidateUsername=null] - The username of the logged-in user.
 * @returns {Promise<Array>} A promise that resolves to an array of filtered and processed job positions.
 */
async function getOpenJobPositions(
  searchTerm = "",
  filters = {},
  candidateUsername = null
) {
  try {
    const searchClause = buildPositionSearchClause(searchTerm);
    const filterClause = buildPositionFilterClause(filters);
    let candidateData = null;
    let appliedClause = {};

    // Apply candidate-specific logic if a username is provided
    if (candidateUsername) {
      candidateData = await prisma.candidate.findUnique({
        where: { username: candidateUsername },
        include: {
          courseHistory: true,
          jobPositionApplicationHistory: { select: { jobPositionId: true } },
        },
      });

      // Filter by applied status (candidate/employee-specific logic)
      if (filters.applied && filters.applied !== "Any" && candidateData) {
        const appliedPositionIds =
          candidateData.jobPositionApplicationHistory.map(
            (app) => app.jobPositionId
          );
        if (filters.applied === "Applied") {
          appliedClause = { id: { in: appliedPositionIds } };
        } else if (filters.applied === "Not Applied") {
          appliedClause = { id: { notIn: appliedPositionIds } };
        }
      }
    }

    const finalWhere = {
      AND: [
        { jobPositionStatus: "OPEN" },
        searchClause,
        filterClause,
        appliedClause,
      ],
    };

    let positions = await prisma.jobPosition.findMany({
      where: finalWhere,
      include: {
        course: true,
        jobSchedules: true,
        employer:{
          include:{
            user:true,
          }
        }
      },
      orderBy: { course: { name: "asc" } },
    });

    // Filter by eligibility (candidate/employee-specific logic)
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

    return positions;
  } catch (error) {
    console.error("Error in getOpenJobPositions:", error);
    throw error;
  }
}

/**
 * Retrieves and filters job positions based on the provided search term, filters, and owner username.
 * @param {string} searchTerm - The text to search for in course names and codes.
 * @param {object} filters - The filter criteria (days, semester, level, location).
 * @param {string} ownerUsername - The username of the owner of the job positions.
 * @returns {Promise<Array>} A promise that resolves to an array of filtered and processed job positions.
 */
async function getJobPositionsByOwner(
  searchTerm = "",
  filters = {},
  ownerUsername = null
) {
  try {
    const searchClause = buildPositionSearchClause(searchTerm);
    const filterClause = buildPositionFilterClause(filters);

    const finalWhere = {
      AND: [{ username: ownerUsername }, searchClause, filterClause],
    };

    return await prisma.jobPosition.findMany({
      where: finalWhere,
      include: {
        course: true,
        jobSchedules: true,
        employer:{
          include:{
            user:true,
          }
        }
      },
      orderBy: { course: { name: "asc" } },
    });
  } catch (error) {
    console.error("Error in getJobPositionsByOwner:", error);
    throw error;
  }
}

/**
 * Searches and filters ALL job positions in the database.
 * @param {string} [searchTerm=''] - Optional text to search for.
 * @param {object} [filters={}] - Optional filter criteria (status, level, etc.).
 * @returns {Promise<Array>}
 */
async function getAllJobPositions(searchTerm = "", filters = {}) {
  try {
    const searchClause = buildPositionSearchClause(searchTerm);
    const filterClause = buildPositionFilterClause(filters);

    const finalWhere = {
      AND: [searchClause, filterClause],
    };

    return await prisma.jobPosition.findMany({
      where: finalWhere,
      include: {
        course: true,
        jobSchedules: true,
        employer:{
          include:{
            user:true,
          }
        }
      },
      orderBy: { course: { name: "asc" } },
    });
  } catch (error) {
    console.error("Error in getAllJobPositions:", error);
    throw error;
  }
}

/**
 * Creates a new JobPosition and its related schedules.
 * @param {object} positionData The data for the new position from the form.
 * @param {object} employerData The data for the employer.
 * @returns {Promise<object>} The newly created JobPosition object with all relations.
 */
async function createJobPosition(positionData, employerData) {
  const {
    jobSchedules,
    semesterCode,
    courseCode,
    sectionNumber,
    maxTAs,
    jobPositionStatus,
    location,
    locationType,
    graduateStatusRequirement,
    gradeRequirement,
    courseTakenRequirement,
    startDate,
    endDate,
  } = positionData;

  const { username, fname, lname } = employerData;

  const newJobId = `${semesterCode}-${courseCode}-${sectionNumber}`;

  try {
    const newPosition = await prisma.$transaction(async (tx) => {
      // Create the new position
      const position = await tx.jobPosition.create({
        data: {
          id: newJobId,
          sectionNumber: parseInt(sectionNumber, 10),
          semesterCode: parseInt(semesterCode, 10),
          courseCode: courseCode,
          username: username,
          maxTAs: maxTAs,
          jobPositionStatus: jobPositionStatus,
          location: location,
          locationType: locationType,
          graduateStatusRequirement: graduateStatusRequirement,
          gradeRequirement: gradeRequirement,
          courseTakenRequirement: courseTakenRequirement,
          startDate: startDate,
          endDate: endDate,
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

      // Create a comment for the new position
      await tx.comment.create({
        data: {
          foreignTableName: "JobPosition",
          foreignKey: position.id,
          author: `${fname} ${lname}`,
          status: jobPositionStatus,
          comment: "New position has been created",
          timestamp: new Date(),
        },
      });

      return position;
    });

    return newPosition;
  } catch (error) {
    if (error.code === "P2002") {
      throw new Error(`A job position with ID ${newJobId} already exists.`);
    }
    console.error(`Failed to create position:`, error);
    throw new Error(`Could not create job position.`);
  }
}

/**
 * Modifies an existing job position and its schedules in a single atomic transaction.
 * @param {string} jobId - The ID of the job position to modify.
 * @param {object} positionData - The updated data for the job position.
 * @param {object} commentData - The comment data for the job position (including the author and comment).
 * @returns {Promise<object>} A promise that resolves to the modified job position with its relations.
 */
async function updateJobPosition(jobId, positionData, commentData) {
  const {
    jobSchedules,
    location,
    locationType,
    maxTAs,
    startDate,
    endDate,
    jobPositionStatus,
    graduateStatusRequirement,
    gradeRequirement,
    courseTakenRequirement,
  } = positionData;

  const { fname, lname, comment } = commentData;

  try {
    const updatedPosition = await prisma.$transaction(async (tx) => {
      // Update the job position
      const position = await tx.jobPosition.update({
        where: { id: jobId },
        data: {
          location: location,
          locationType: locationType,
          maxTAs: maxTAs,
          startDate: startDate,
          endDate: endDate,
          jobPositionStatus: jobPositionStatus,
          graduateStatusRequirement: graduateStatusRequirement,
          gradeRequirement: gradeRequirement,
          courseTakenRequirement: courseTakenRequirement,
          jobSchedules: {
            deleteMany: {},
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

      // Create a comment for the updated position
      await tx.comment.create({
        data: {
          foreignTableName: "JobPosition",
          foreignKey: jobId,
          author: `${fname} ${lname}`,
          status: jobPositionStatus,
          comment: "" + comment,
          timestamp: new Date(),
        },
      });

      return position;
    });

    return updatedPosition;
  } catch (error) {
    console.error(`Failed to modify position ${jobId}:`, error);
    throw new Error(`Could not modify job position ${jobId}.`);
  }
}

/**
 * Update the status of a job position and create a comment for the update in a single atomic transaction.
 * @param {string} jobId - The ID of the job position to modify.
 * @param {string} status - The new status for the job position.
 * @param {object} commentData - The comment data for the job position (including the author and comment).
 * @returns
 */
async function updateJobPositionStatus(jobId, status, commentData) {
  const { fname, lname, comment } = commentData;

  try {
    const updatedPosition = await prisma.$transaction(async (tx) => {
      // Update the job position
      const position = await tx.jobPosition.update({
        where: { id: jobId },
        data: {
          jobPositionStatus: status,
        },
        include: {
          course: true,
          jobSchedules: true,
        },
      });

      // Create a comment for the updated position
      await tx.comment.create({
        data: {
          foreignTableName: "JobPosition",
          foreignKey: jobId,
          author: `${fname} ${lname}`,
          status: status,
          comment: comment,
          timestamp: new Date(),
        },
      });

      return position;
    });

    return updatedPosition;
  } catch (error) {
    console.error(`Failed to modify position ${jobId}:`, error);
    throw new Error(`Could not modify job position ${jobId}.`);
  }
}

// --- Application Notes ---
/**
 * Updates the note for a given application or creates one if it does not exist.
 * @param {Number} applicationId 
 * @param {String} note 
 * @returns {Promise<object>} A promise that resolves to the new application note
 */
async function updateApplicationNote(applicationId, note) {
  try {
    return prisma.applicationNote.upsert({
      where: { applicationId: applicationId },
      update: { note: note },
      create: {
        note: note,
        applicationId: applicationId
      }
    });
  }catch (error) {
    console.error(`Failed to upsert application note:`, error);
    throw new Error(`Could not upsert application note.`)
  }
}

/**
 * Gets the note from the matching application.
 * @param {Number} applicationId 
 * @returns {Promise<object>} A promise that resolves to the application note
 */
async function getApplicationNote(applicationId) {
  try {
    const note = await prisma.applicationNote.findUnique({
      where: { applicationId: applicationId },
    });
    if (note){
      return note.note; // Succesfully Contains the correct text
    }
    return "";
  }catch (error) {
    console.error(`Failed to get application note:`, error);
    throw new Error(`Could not get application note.`)
  }
}

// --- JOB APPLICATIONS ---
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
      coverLetterId
    } = applicationDetails;

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

    // Validate candidate, job position, and resume exist
    const [candidate, jobPosition, resume] = await Promise.all([
      prisma.candidate.findUnique({ where: { username: candidateUsername } }),
      prisma.jobPosition.findUnique({
        where: { id: jobPositionId },
        include: {
          course: true,
          employer: { include: { user: true } },
        },
      }),
      prisma.resume.findFirst({
        where: { id: resumeId, username: candidateUsername },
      }),
    ]);
    if (!candidate)
      throw new Error(`Candidate ${candidateUsername} not found.`);
    if (!jobPosition)
      throw new Error(`Job Position ${jobPositionId} not found.`);
    if (!resume)
      throw new Error(`Resume ${resumeId} not found for ${candidateUsername}.`);

    // Ensure no duplicate applications
    const existing = await prisma.jobPositionApplicationHistory.findFirst({
      where: { username: candidateUsername, jobPositionId },
    });
    if (existing)
      throw new Error(
        "This candidate has already applied for this job position."
      );

    let formData;
    try {
      formData = typeof jobPositionApplicationFormData === 'string' ? JSON.parse(jobPositionApplicationFormData) : jobPositionApplicationFormData;
    } catch (e) {
      throw new Error('Invalid jobPositionApplicationFormData: JSON parse failed');
    }

    // Basic validation for required form fields
    if (!formData || !formData.fname || !formData.lname || !formData.email || !formData.uid) {
      throw new Error('Missing required form fields (fname, lname, email, uid)');
    }
    // Ensure year parses to an integer or is undefined
    const parsedYear = formData.year !== undefined && formData.year !== null && formData.year !== '' ? parseInt(formData.year, 10) : undefined;
    if (formData.year !== undefined && (isNaN(parsedYear) || parsedYear <= 0)) {
      throw new Error('Invalid year value in application form');
    }

    // Create new application
    const newApp = await prisma.jobPositionApplicationHistory.create({
      data: {
        username: candidateUsername,
        candidateUID: formData.uid,
        jobPositionId,
        resumeId,
        jobApplicationStatus: "APPLIED",
        candidateFName: formData.fname,
        candidateLName: formData.lname,
        candidatePronouns: formData.pronouns,
        candidateEmail: formData.email,
        candidateMajor: formData.major,
        candidateYear: parsedYear,
        candidateGrade: formData.grade,
        wasPriorEmployeeForThisCourse: formData.wasPriorEmployeeForThisCourse,
        wasPriorEmployeeForOtherCourses:
          formData.wasPriorEmployeeForOtherCourses,
        priorEmploymentHistory: formData.priorEmploymentHistory
          ?.map((i) => i.courseCode)
          .join(", "),
        coverLetterId: coverLetterId,
      },
    });

    // System comment
    await prisma.comment.create({
      data: {
        foreignTableName: "JobPositionApplicationHistory",
        foreignKey: String(newApp.id),
        author: `${formData.fname} ${formData.lname}`,
        status: "APPLIED",
        comment: "Candidate submitted application.",
        timestamp: new Date(),
      },
    });

  // Notify stakeholders + candidate
    try {
      const { employerEmail } = await getCourseStakeholders(newApp.jobPositionId);
      const candidateUserId = String(newApp.candidateEmail).split('@', 1)[0].toLowerCase();
      await dispatchTemplated(candidateUserId, {
        event: 'application_status_changed',
        role: 'candidate',
        userEmail: newApp.candidateEmail,
        subject: 'TA Application Status Update',
        context: {
          recipient: { name: `${newApp.candidateFName} ${newApp.candidateLName}` , email: newApp.candidateEmail },
          item: {
            id: jobPositionId,
            title: jobPosition.course.name,
            ownerName: `${jobPosition.employer.user.fname} ${jobPosition.employer.user.lname}`,
            ownerEmail: jobPosition.employer.user.email,
          },
          status: { new: 'APPLIED' },
          flags: { applied: true },
          cta: { url: await buildAppLink({ jobPositionId: jobPositionId, applicationId: newApp.id }) },
          appName: 'TA Portal',
        }
      });

      // Best-effort employer confirmation
      if (employerEmail) {
        const employerUserId = String(employerEmail).split('@', 1)[0].toLowerCase();
        try {
          await dispatchTemplated(employerUserId, {
            event: 'application_status_changed',
            role: 'employer',
            userEmail: employerEmail,
            subject: 'TA Application Status Update',
            context: {
              // generic structure
              recipient: {
                name: `${jobPosition.employer.user.fname} ${jobPosition.employer.user.lname}`,
                email: employerEmail,
              },
              item: {
                id: jobPositionId,
                title: jobPosition.course.name,
                ownerName: `${jobPosition.employer.user.fname} ${jobPosition.employer.user.lname}`,
                ownerEmail: employerEmail,
                candidateName: `${newApp.candidateFName} ${newApp.candidateLName}`,
                candidateEmail: newApp.candidateEmail,
              },
              status: { new: 'APPLIED' },
              flags: { applied: true },
              cta: { url: await buildAppLink({ jobPositionId: jobPositionId, applicationId: newApp.id }) },
              appName: 'TA Portal',
            },
          });
        } catch (e) {
          console.error('Employer notify (APPLICATION_RECEIVED) failed:', e && e.message);
        }
      }
    } catch (e) {
      console.error("Notify APPLICATION_RECEIVED failed:", e.message);
    }

    return newApp;
  } catch (err) {
    console.error("Error in applyForJobPosition:", err);
    throw err;
  }
}


/**
 * Helper function to get the application (current used for deletion of application and cover letter file specifically)
 * @param {string} candidateUsername - The username of the candidate.
 * @param {number} jobPositionId - The ID of the job position.
 * @returns {Promise<object>} A promise that resolves to the application record.
 */
async function getCandidateApplication(candidateUsername, jobPositionId) {
  const application = await prisma.jobPositionApplicationHistory.findFirst({
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
      jobApplicationStatus: { in: ["ACCEPTED_OFFER", "HIRED"] },
      jobPosition: {
        semesterCode: semestercode,
      },
    },
  });
  return !!application;
}

/**
 * Updates an application's status and creates a new comment record in a transaction,
 * then sends Slack notifications to the candidate + stakeholders (employer + active TAs).
 */
/**
 * Updates a candidate's job application status, logs the change, and notifies stakeholders.
 *
 * Workflow:
 * 1. Update the application's status inside a DB transaction.
 *    - Also create a comment log entry.
 *    - If status is ACCEPTED_OFFER, mark the job position as FILLED if capacity is reached.
 * 2. After a successful transaction, send Slack notifications to the candidate and stakeholders.
 * 3. Return the updated application record.
 *
 * @param {string} author - Name of the user making the status change.
 * @param {number} applicationId - The ID of the application record to update.
 * @param {string} status - New status for the application (must match JobApplicationStatus enum).
 * @param {string} comments - Additional context or comments for the status change.
 * @returns {Promise<Object>} - The updated job application record.
 *
 * @throws {Error} If the application/job position is not found or Prisma transaction fails.
 */
async function changeCandidateApplicationStatus(
  author,
  applicationId,
  status,
  comments
) {
  const VALID_STATUSES = [
    "APPLIED",
    "INTERVIEW",
    "ONHOLD",
    "REJECTED",
    "PENDING_OFFER",
    "ACCEPTED_OFFER",
    "DECLINED_OFFER",
    "HIRED",
    "INACTIVE",
  ];

  if (!VALID_STATUSES.includes(status)) {
    throw new Error(
      `Invalid status: ${status}. Must be one of ${VALID_STATUSES.join(", ")}`
    );
  }

  let updatedApp;
  try {
    updatedApp = await prisma.$transaction(async (tx) => {
      const appUpdate = await tx.jobPositionApplicationHistory.update({
        where: { id: applicationId },
        data: { jobApplicationStatus: status },
      });
      if (!appUpdate)
        throw new Error(`Application ${applicationId} not found.`);

      await tx.comment.create({
        data: {
          foreignTableName: "JobPositionApplicationHistory",
          author,
          foreignKey: String(applicationId),
          status,
          comment: comments || `No message provided`,
          timestamp: new Date(),
        },
      });

      // Handle filled job positions if accepted offer
      if (status === "ACCEPTED_OFFER") {
        const jobPos = await tx.jobPosition.findUnique({
          where: { id: appUpdate.jobPositionId },
          include: {
            course: true,
            employer: { include: { user: true } 
          }
        }
        });
        if (jobPos) {
          const acceptedCount = await tx.jobPositionApplicationHistory.count({
            where: {
              jobPositionId: jobPos.id,
              jobApplicationStatus: { in: ["ACCEPTED_OFFER", "HIRED"] },
            },
          });
          if (acceptedCount >= jobPos.maxTAs) {
            await tx.jobPosition.update({
              where: { id: jobPos.id },
              data: { jobPositionStatus: "FILLED" },
            });
          }
        }
      }

      return appUpdate;
    });
  } catch (err) {
    console.error("Error in changeCandidateApplicationStatus:", err);
    throw err;
  }

  // Notifications
try {
  const details = await getApplicationDetailsForNotify(applicationId);
  if (!details) throw new Error("Application not found for notify");

  const { candidateName, candidateEmail, jobPositionId } = details;

  // All application status changes use the same event name
  const eventType = "application_status_changed";

  {
    const candidateUserId = String(candidateEmail).split('@', 1)[0].toLowerCase();
    await dispatchTemplated(candidateUserId, {
      event: eventType,
      role: 'candidate',
      userEmail: candidateEmail,
      subject: 'TA Application Status Update',
      context: {
        recipient: { name: candidateName, email: candidateEmail },
        item: { id: details.jobPositionId, title: details.courseName, ownerName: details.instructorName, ownerEmail: details.instructorEmail },
        status: { new: status },
        comment: comments || "",
        flags: { hired: status === 'HIRED', acceptedOffer: status === 'ACCEPTED_OFFER' },
        cta: { url: await buildAppLink({ jobPositionId: details.jobPositionId, applicationId }) },
        appName: 'TA Portal',
      }
    });
  }

  // Employer confirmation (status change)
  try {
    const employerEmail = details.instructorEmail;
    if (employerEmail) {
      const employerUserId = String(employerEmail).split('@', 1)[0].toLowerCase();
      await dispatchTemplated(employerUserId, {
        event: eventType,
        role: 'employer',
        userEmail: employerEmail,
        subject: 'TA Application Status Update',
        context: {
          // generic
          recipient: { name: details.instructorName, email: employerEmail },
          item: {
            id: details.jobPositionId,
            title: details.courseName,
            ownerName: details.instructorName,
            ownerEmail: employerEmail,
            candidateName: details.candidateName,
            candidateEmail: details.candidateEmail,
          },
          status: { new: status },
          comment: comments || "",
          flags: { hired: status === 'HIRED', acceptedOffer: status === 'ACCEPTED_OFFER' },
          cta: { url: await buildAppLink({ jobPositionId: details.jobPositionId, applicationId }) },
          appName: 'TA Portal',
        },
      });
    }
  } catch (e) {
    console.error('Employer notify (status change) failed:', e && e.message);
  }

  // Admins should be notified when a candidate accepts an offer
  if (status === 'ACCEPTED_OFFER') {
    try {
      const adminEmails = (await getAdminEmails()) || [];
      // Do not send admin emails to the instructor/employer
      const adminList = adminEmails.filter(e => e && e.toLowerCase() !== String(details.instructorEmail || '').toLowerCase());
      for (const adminEmail of adminList) {
        const adminUserId = String(adminEmail).split('@', 1)[0].toLowerCase();
        await dispatchTemplated(adminUserId, {
          event: 'admin_hire_notification',
          role: 'admin',
          userEmail: adminEmail,
          subject: 'TA Application Status Update',
          context: {
            // generic
            recipient: { email: adminEmail },
            item: { id: details.jobPositionId, title: details.courseName, ownerName: details.instructorName },
            status: { new: status },
            comment: comments || "",
            flags: { acceptedOffer: true },
            cta: { url: await buildAppLink({ jobPositionId: details.jobPositionId, applicationId }) },
            appName: 'TA Portal',
          },
        });
      }
    } catch (e) {
      console.error('Admin notify (ACCEPTED_OFFER) failed:', e && e.message);
    }
  }
} catch (e) {
  console.error("Slack notify (status change) failed:", e.message);
}

  return updatedApp;
}

/**
 * Hire a candidate for a job position and promote them to a TA(Employee).
 * @param {string} candidateUsername - The username of the candidate to be hired.
 * @param {string} applicationId - The ID of the application record.
 * @param {string} jobPositionId - The ID of the job position the candidate is being hired for.
 * @param {number} employeeId - The ID for the candidate to be hired.
 * @returns {Promise<object>} A promise that resolves to the updated application record.
 */
/**
 * Hires a candidate for a specific job position.
 *
 * Workflow:
 * 1. Update the candidate's application status to "HIRED".
 * 2. Log a comment record for the hiring action.
 * 3. Promote the candidate's user role to "EMPLOYEE".
 * 4. Upsert an Employee record (create or activate if exists).
 * 5. Add a JobPositionHistory record to track employment.
 * 6. If the position reaches max TAs, mark it as ACTIVE and log a comment.
 * 7. Send Slack notification to the candidate and stakeholders.
 *
 * @param {string} candidateUsername - The username of the candidate being hired.
 * @param {number} applicationId - The ID of the candidate's job application.
 * @param {string} jobPositionId - The ID of the job position being filled.
 * @param {Object} messageData - Metadata for the hiring comment.
 * @param {string} messageData.author - Who performed the hiring action.
 * @param {string} messageData.comment - Context about the hiring action.
 * @returns {Promise<Object>} - The updated job application record.
 *
 * @throws {Error} If any DB operation fails (e.g., application/position not found).
 */
async function hireCandidateForJobPosition(
  candidateUsername,
  applicationId,
  jobPositionId,
  messageData
) {
  try {
    // =====================================================
    // 1) Update application status to HIRED
    // =====================================================
    const updatedApplication =
      await prisma.jobPositionApplicationHistory.update({
        where: { id: applicationId },
        data: { jobApplicationStatus: "HIRED" },
      });

    // =====================================================
    // 2) Log hiring comment
    // =====================================================
    await prisma.comment.create({
      data: {
        foreignTableName: "JobPositionApplicationHistory",
        author: messageData.author,
        foreignKey: String(applicationId),
        status: "HIRED",
        comment: messageData.comment || "No message provided",
        timestamp: new Date(),
      },
    });

    // =====================================================
    // 3) Promote candidate to EMPLOYEE role
    // =====================================================
    const user = await prisma.user.update({
      where: { username: candidateUsername },
      data: { role: "EMPLOYEE" },
    });

    // =====================================================
    // 4) Ensure Employee record exists & is ACTIVE
    // =====================================================
    await prisma.employee.upsert({
      where: { id: user.uid },
      update: {
        employeeStatus: "ACTIVE",
        username: candidateUsername,
      },
      create: {
        id: user.uid,
        username: candidateUsername,
        employeeStatus: "ACTIVE",
      },
    });

    // =====================================================
    // 5) Add JobPositionHistory record
    // =====================================================
    await prisma.jobPositionHistory.create({
      data: {
        jobPositionId,
        employeeId: user.uid,
        jobPositionHistoryStatus: "ACTIVE",
      },
    });

    // =====================================================
    // 6) Check if position is full (max TAs reached)
    // =====================================================
    const jobPosition = await prisma.jobPosition.findUnique({
      where: { id: jobPositionId },
      include: {
        course: true,
        employer: { include: { user: true } }
      }
    });

    if (!jobPosition) {
      throw new Error(`Job position with ID ${jobPositionId} not found`);
    }

    const activeJobPositionHistoryCount = await prisma.jobPositionHistory.count(
      {
        where: { jobPositionId, jobPositionHistoryStatus: "ACTIVE" },
      }
    );

    if (activeJobPositionHistoryCount >= jobPosition.maxTAs) {
      // Mark the job as ACTIVE
      await prisma.jobPosition.update({
        where: { id: jobPositionId },
        data: { jobPositionStatus: "ACTIVE" },
      });

      // Log comment for job position activation
      await prisma.comment.create({
        data: {
          foreignTableName: "JobPosition",
          author: messageData.author,
          foreignKey: String(jobPositionId),
          status: "ACTIVE",
          comment:
            "Position is now active as all accepted offers have been hired.",
          timestamp: new Date(),
        },
      });
    }

    // =====================================================
    // 7) Send notification (candidate + stakeholders)
    // =====================================================
    try {
      const details = await getApplicationDetailsForNotify(applicationId);
      if (details) {
  const { candidateName, candidateEmail, jobPositionId } = details;
        const { emails: stakeholderEmails } = await getCourseStakeholders(
          jobPositionId
        );

        {
          const candidateUserId = String(candidateEmail).split('@', 1)[0].toLowerCase();
          await dispatchTemplated(candidateUserId, {
            event: 'application_status_changed',
            role: 'candidate',
            userEmail: candidateEmail,
            subject: 'TA Application Status Update',
            context: {
              recipient: { name: candidateName, email: candidateEmail },
              item: { id: jobPositionId, title: jobPosition.course?.name, ownerName: `${jobPosition.employer.user.fname} ${jobPosition.employer.user.lname}` },
              status: { new: 'HIRED' },
              comment: messageData?.comment || "",
              flags: { hired: true },
              cta: { url: await buildAppLink({ jobPositionId, applicationId }) },
              appName: 'TA Portal',
            },
          });
        }

        // Employer confirmation for hire event
        const employerEmail = jobPosition.employer?.user?.email;
        if (employerEmail) {
          const employerUserId = String(employerEmail).split('@', 1)[0].toLowerCase();
          try {
            await dispatchTemplated(employerUserId, {
              event: 'application_status_changed',
              role: 'employer',
              userEmail: employerEmail,
              subject: 'TA Application Status Update',
              context: {
                // generic
                recipient: { name: `${jobPosition.employer.user.fname} ${jobPosition.employer.user.lname}` , email: employerEmail },
                item: {
                  id: jobPositionId,
                  title: jobPosition.course?.name,
                  ownerName: `${jobPosition.employer.user.fname} ${jobPosition.employer.user.lname}`,
                  candidateName: candidateName,
                  candidateEmail: candidateEmail,
                },
                status: { new: 'HIRED' },
                comment: messageData?.comment || "",
                flags: { hired: true },
                cta: { url: await buildAppLink({ jobPositionId, applicationId }) },
                appName: 'TA Portal',
              },
            });
          } catch (e) {
            console.error('Employer notify (HIRED) failed:', e && e.message);
          }
        }

        // Admin notification for completed hire (informational)
        try {
          const adminEmails = (await getAdminEmails()) || [];
          // Exclude employer address from admin list
          const adminList = adminEmails.filter(e => e && e.toLowerCase() !== String(employerEmail || '').toLowerCase());
          for (const adminEmail of adminList) {
            const adminUserId = String(adminEmail).split('@', 1)[0].toLowerCase();
            await dispatchTemplated(adminUserId, {
              event: 'application_status_changed',
              role: 'admin',
              userEmail: adminEmail,
              subject: 'TA Application Status Update',
              context: {
                // generic
                recipient: { email: adminEmail },
                item: { id: jobPositionId, title: jobPosition.course?.name, ownerName: `${jobPosition.employer.user.fname} ${jobPosition.employer.user.lname}` },
                status: { new: 'HIRED' },
                comment: messageData?.comment,
                flags: { hired: true },
                cta: { url: await buildAppLink({ jobPositionId, applicationId }) },
                appName: 'TA Portal',
              },
            });
          }
        } catch (e) {
          console.error('Admin notify (HIRED) failed:', e && e.message);
        }
      }
    } catch (e) {
      console.error("Slack notify (hiring) failed:", e.message);
    }

    // =====================================================
    // 8) Return final updated application record
    // =====================================================
    return updatedApplication;
  } catch (error) {
    console.error("Error in hireCandidateForJobPosition:", error);
    throw error;
  }
}

/**
 * Get all of the distinct semester codes that exist in the database based on the provided filters.
 * @param {string} status - The job position status to filter by.
 * @param {string} employer - The username of the employer to filter by.
 * @returns {Promise<Array>} A promise that resolves to an array of unique semester codes.
 */
async function getSemesterCodes(status, employer) {
  const whereClause = {};
  if (status) {
    whereClause.jobPositionStatus = status;
  }
  if (employer) {
    whereClause.username = employer;
  }
  const positions = await prisma.jobPosition.findMany({
    where: { ...whereClause },
    select: { semesterCode: true },
    distinct: ["semesterCode"],
  });
  return positions.map((position) => position.semesterCode);
}

// === Recipients helpers ===

/**
 * Given a jobPositionId, return employer email(s) and active TA emails.
 */
async function getCourseStakeholders(jobPositionId) {
  // Employer email
  const pos = await prisma.jobPosition.findUnique({
    where: { id: jobPositionId },
    select: {
      username: true,
      employer: {
        select: {
          user: { select: { email: true } },
        },
      },
    },
  });

  const employerEmail = pos?.employer?.user?.email || null;

  // Active TAs on this position (via JobPositionHistory -> Employee -> Candidate -> User)
  const taRecords = await prisma.jobPositionHistory.findMany({
    where: {
      jobPositionId,
      jobPositionHistoryStatus: "ACTIVE",
    },
    select: {
      employee: {
        select: {
          candidate: {
            select: {
              user: { select: { email: true } },
            },
          },
        },
      },
    },
  });

  const taEmails = taRecords
    .map((r) => r.employee?.candidate?.user?.email)
    .filter(Boolean);

  const emails = [...new Set([employerEmail, ...taEmails].filter(Boolean))];
  return { employerEmail, taEmails, emails };
}

/**
 * Return all admin emails.
 */
async function getAdminEmails() {
  const admins = await prisma.user.findMany({ where: { role: 'ADMIN' }, select: { email: true } });
  return admins.map(a => a.email).filter(Boolean);
}

/**
 * Return candidate email for a given application record id.
 */
async function getCandidateEmailByApplicationId(applicationId) {
  const app = await prisma.jobPositionApplicationHistory.findUnique({
    where: { id: applicationId },
    select: { candidateEmail: true, jobPositionId: true },
  });
  if (!app) return { candidateEmail: null, jobPositionId: null };
  return {
    candidateEmail: app.candidateEmail,
    jobPositionId: app.jobPositionId,
  };
}

// Backwards-compat wrapper for older callers
async function getApplicantEmailByApplicationId(applicationId) {
  const r = await getCandidateEmailByApplicationId(applicationId);
  return { applicantEmail: r.candidateEmail, jobPositionId: r.jobPositionId };
}

// === Helper for notifications ===
async function getApplicationDetailsForNotify(applicationId) {
  const app = await prisma.jobPositionApplicationHistory.findUnique({
    where: { id: applicationId },
    select: {
      id: true,
      jobPositionId: true,
      candidateFName: true,
      candidateLName: true,
      candidateEmail: true,
      jobPosition: {
        select: {
          courseCode: true,
          sectionNumber: true,
          semesterCode: true,
          course: {
            select: {
              name: true,
            },
          },
          employer: {
            select: {
              user: {
                select: {
                  fname: true,
                  lname: true,
                  email: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!app) return null;

  const candidateName = `${app.candidateFName} ${app.candidateLName}`;
  const candidateEmail = app.candidateEmail;
  const out = {
    // primary keys (preferred)
    candidateName,
    candidateEmail,
    jobPositionId: app.jobPositionId,
    courseCode: app.jobPosition.courseCode,
    courseName: app.jobPosition.course.name, // ✅ now works
    section: app.jobPosition.sectionNumber,
    semester: app.jobPosition.semesterCode,
    instructorName: `${app.jobPosition.employer.user.fname} ${app.jobPosition.employer.user.lname}`,
    instructorEmail: app.jobPosition.employer.user.email,
  };

  // keep legacy keys for callers that still expect 'applicant*'
  out.applicantName = out.candidateName;
  out.applicantEmail = out.candidateEmail;
  return out;
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
    // This is the new, more concise line that replaces the old block.
    where.OR = filters.level.map((levelString) => ({
      courseCode: {
        // Extracts the first digit (e.g., "1" from "100-level")
        contains: `-${levelString.charAt(0)}`,
      },
    }));
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
async function getCandidateApplications(
  searchTerm,
  filters,
  candidateUsername
) {
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
          employer:{
            include:{
              user: true
            },
          },
        },
      },
      resume: {
        select: { name: true, id: true },
      },
      coverLetter: {
        select: { name: true, id: true }
      }
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
    } else if (searchBy === "student") {
      // Split the search term by spaces to handle first and last names.
      const nameParts = trimmedSearchTerm.split(" ").filter((part) => part);

      // Build a condition that requires each part of the name to be present in either the first or last name field.
      // This handles "Jane Doe", "Doe Jane", "Jane", and "Doe" searches gracefully.
      const studentNameCondition = {
        AND: nameParts.map((part) => ({
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
            select: { name: true, id: true },
          },
          coverLetter: {
            select: { name: true, id: true }
          }
        },
      },
      employer: {
        select: { 
          user: {
            select: {
              fname: true,
              lname: true
            }
          } 
        }
      }
    },
  });

  return positions;
}
/**
 * Gets all applications for hiring for admin
 * @returns retrieves all applications for hiring
 */
async function getCandidateApplicationsAsAdmin() {
  return await prisma.jobPositionApplicationHistory.findMany({
    where: {
      jobApplicationStatus: "ACCEPTED_OFFER",
    },
    include: {
      jobPosition: {
        include: {
          course: {
            select: { name: true, description: true },
          },
          jobSchedules: {
            select: { dayOfWeek: true, startTime: true, endTime: true },
          },
          employer: {
            include: {
              user: {
                select: {
                  fname: true,
                  lname: true,
                },
              },
            },
          },
        },
      },
      resume: {
        select: { name: true, id: true },
      },
      coverLetter: {
        select: { name: true, id: true }
      }
    },
  });
}

/**
 * Gets ALL applications across the system for admin viewing with search and filters
 * @param {string} search - Search term (course code/name or student name)
 * @param {string} searchType - Type of search ("course" or "student")
 * @param {object} filters - Object containing status, level, semester, hasApplications filters
 * @returns {Promise<Array>} Array of job positions with their application history
 */
async function getAllApplicationsForAdmin(search = '', searchType = 'course', filters = {}) {
  const whereClause = {};
  
  // Validate and sanitize search input to prevent performance issues
  if (search && search.length > 100) {
    throw new Error('Search query too long (max 100 characters)');
  }
  
  // Handle search by course code or name
  if (search && searchType === 'course') {
    whereClause.OR = [
  { courseCode: { contains: search } },
  { course: { is: { name: { contains: search } } } }
];
  }

  // Filter by semester
  if (filters.semester) {
    whereClause.semesterCode = Number(filters.semester);
  }

  // Build the query
  const positions = await prisma.jobPosition.findMany({
    where: whereClause,
    include: {
      course: {
        select: { name: true, description: true },
      },
      jobSchedules: {
        select: { dayOfWeek: true, startTime: true, endTime: true },
      },
      employer: {
        include: {
          user: {
            select: {
              fname: true,
              lname: true,
            },
          },
        },
      },
      jobPositionApplicationHistory: {
        where: buildApplicationFilterClause(filters),
        include: {
          candidate: {
            include: {
              user: {
                select: {
                  fname: true,
                  lname: true,
                  email: true,
                },
              },
            },
          },
          resume: {
            select: { name: true, id: true },
          },
          coverLetter: {
            select: { name: true, id: true }
          }
        },
      },
    },
  });

  // Filter by student name if searchType is "student"
  if (search && searchType === 'student') {
    const searchLower = search.toLowerCase();
    return positions.filter(position => {
      return position.jobPositionApplicationHistory.some(app => {
        const fname = app.candidate?.user?.fname?.toLowerCase() || '';
        const lname = app.candidate?.user?.lname?.toLowerCase() || '';
        const fullName = `${fname} ${lname}`;
        return fullName.includes(searchLower) || fname.includes(searchLower) || lname.includes(searchLower);
      });
    });
  }

  // Filter by hasApplications
  if (filters.hasApplications === 'yes') {
    return positions.filter(p => p.jobPositionApplicationHistory.length > 0);
  } else if (filters.hasApplications === 'no') {
    return positions.filter(p => p.jobPositionApplicationHistory.length === 0);
  }

  return positions;
}


/**
 * Check if a job position is full based on its status
 * @param {string} jobPositionId - The ID of the job position to check
 * @returns {Promise<boolean>} Returns true if job position status is 'FILLED' or 'ACTIVE', false otherwise
 */
async function isJobPositionFull(jobPositionId) {
  const jobPosition = await prisma.jobPosition.findUnique({
    where: { id: jobPositionId },
    include: {
      course: true,
      employer: { include: { user: true } }
    }
  });

  if (!jobPosition) {
    throw new Error(`Job position ${jobPositionId} not found`);
  }

  return (
    jobPosition.jobPositionStatus === "FILLED" ||
    jobPosition.jobPositionStatus === "ACTIVE"
  );
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
 * Checks to see if any provided fields are taken by an existing user.
 * @param {Object} fields - a dictionary containing any number of entries of user information such as username, email, and uid
 * @returns a dictionary with an available entry that is true when none of the fields are taken and false otherwise. A takenFields entry with a list of which entries were already taken.
 */
async function checkUserAvailability(fields){
  try{
    const {username, email, uid} = fields;
    const takenFields = [];

    // Build dynamic checks
    const checks = [];

    if (username) {
      checks.push(
        prisma.user.findUnique({
          where: { username: username }
        }).then((user) => {
          if (user) takenFields.push("username");
        })
      );
    }

    if (email) {
      checks.push(
        prisma.user.findFirst({
          where: { email: email }
        }).then((user) => {
          if (user) takenFields.push("email");
        })
      );
    }

    if (uid) {
      checks.push(
        prisma.user.findFirst({
          where: { uid: uid }
        }).then((user) => {
          if (user) takenFields.push("uid");
        })
      );
    }

    // Run all checks in parallel
    await Promise.all(checks);

    const available = takenFields.length === 0;

    return {
      available,
      takenFields
    }
  } catch(e){
    console.error(e);
    throw e;
  }
}


/**
 * Retrieves a user by their username.
 * @param {string} username - The unique identifier of the user.
 * @returns {Promise<object|null>} A promise that resolves to the user object, or null if not found.
 */
async function getUser(username) {
  try {
    const user = await prisma.user.findUnique({
      where: { username: username },
    });

    if (!user) {
      return null;
    }

    // Destructure the user object to separate the password from the rest of the fields
    const { password, ...userWithoutPassword } = user;

    // Return the object containing all other fields
    return userWithoutPassword;
  } catch (error) {
    console.error("Error retrieving user:", error);
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
      where: { username: username },
    });

    if (!user) {
      // User not found
      return null;
    }

    // Verify the password using our new function
    const isPasswordCorrect = await verifyPassword(password, user.password);

    if (isPasswordCorrect) {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    }
    return null;
  } catch (error) {
    console.error("Error authenticating user:", error);
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
        role: true,
      },
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
              jobPositionApplicationHistory: { 
                include: { jobPosition: true }
              },
              employee: {
                include: {
                  jobPositionHistory: true,
                },
              },
            },
          },
        },
      });
    }
    // If the user is an Employer or Admin, fetch their detailed employer profile.
    else if (
      userRoleInfo.role === "EMPLOYER" ||
      userRoleInfo.role === "ADMIN"
    ) {
      fullProfile = await prisma.user.findUnique({
        where: { username: username },
        include: {
          employer: {
            include: {
              jobPositions: { 
                include: { 
                  course: true, 
                  jobSchedules: true, 
                  jobPositionApplicationHistory: {
                    include: {
                      resume: true,
                    }
                  }
                } 
              },
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
          graduateStatus: normalizeGraduateStatus(candidateData.graduateStatus),
          wasPriorEmployee: candidateData.wasPriorEmployee || false,
        },
      });

      // 3. Create Course History entries, if provided.
      if (
        candidateData.courseHistory &&
        candidateData.courseHistory.length > 0
      ) {
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
          graduateStatus: normalizeGraduateStatus(updatePayload.graduateStatus),
          wasPriorEmployee: updatePayload.wasPriorEmployee,
        },
      });

      // 3. Handle Course History (replace all existing entries).
      if (updatePayload.courseHistory) {
        await tx.courseHistory.deleteMany({
          where: { username: updatePayload.username },
        });
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
      return tx.user.findUnique({
        where: { username: updatePayload.username },
      });
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
      const employeeDbIds = employeeRecords.map((emp) => emp.id);

      // 2. Update all associated JobPositionHistory entries to TERMINATED.
      await tx.jobPositionHistory.updateMany({
        where: {
          employeeId: { in: employeeDbIds },
          jobPositionHistoryStatus: { in: ["ACTIVE", "INACTIVE"] },
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
 * Searches the db for the resume with the matching id
 * @param {number} resumeId 
 * @returns {Promise<object>} A promise that resolves to the resume with the matching id.
 */
async function getResumeById(resumeId){
  try{
    return await prisma.resume.findUnique({
      where:{
        id: resumeId,
      },
    });
  } catch(error){
    console.error("Error getting resume:", error);
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
 * If the resume is used in an application, mark it as isSoftDeleted instead of removing the entry.
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
            isSoftDeleted: false
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
      // If an application uses this resume, soft delete the resume
      if (associatedApplication) {
        const softDeletedResume = await tx.resume.update({
          where: { id: resumeId },
          data: { 
            isSoftDeleted: true,
            isPrimary: false
          }
        })
        return softDeletedResume
      } else{
        // Otherwise, delete the actual resume record.
        const deletedResume = await tx.resume.delete({
          where: { id: resumeId },
        });
        return deletedResume
      }
    });
  } catch (error) {
    console.error("Error deleting resume:", error);
    throw error;
  }
}

/**
 * Checks to see if the given resume is soft deleted and deletes it only if there are no applications that use it.
 * @param {number} resumeId 
 * @returns {boolean} Was the resume entry deleted?
 */
async function checkResumeDeleteStatus(resumeId) {
  const resume = await prisma.resume.findUnique({
    where:{
      id: resumeId
    }
  })
  
  if (resume.isSoftDeleted){
    const resumeCount = await prisma.jobPositionApplicationHistory.count({
      where: {
        resumeId: resume.id,
      }
    });
    
    // If no other applications use it, fully delete it
    if (resumeCount === 0) {
      await prisma.resume.delete({
        where:{
          id: resume.id
        }
      })
      return true
    }
  }
  return false
}

// =============================================================================
// COVER LETTER QUERIES
// =============================================================================

/**
 * creates a cover letter entry.
 * @param {string} username 
 * @param {string} coverLetterURL 
 * @param {string} name 
 * @returns {Promise<object>} A promise that resolves to the newly created cover letter record.
 */
async function addNewCoverLetter(username, coverLetterURL, name) {
  try {
    return await prisma.CoverLetter.create({
      data: {
        username: username,
        coverLetterURL: coverLetterURL,
        name: name,
      },
    });
  } catch (error) {
    console.error("Error adding new cover letter:", error);
    throw error;
  }
}

/**
 * Searches the db for the cover letter with the matching id
 * @param {number} coverLetterId 
 * @returns {Promise<object>} A promise that resolves to the cover letter with the matching id.
 */
async function getCoverLetterById(coverLetterId){
  try{
    return await prisma.CoverLetter.findUnique({
      where:{
        id: coverLetterId,
      },
    });
  } catch(error){
    console.error("Error getting cover letter:", error);
    throw error;
  }
}

/**
 * Deletes the cover letter entry
 * @param {number} coverLetterId 
 * @returns {Promise<object>} A promise that resolves to the deleted cover letter entry.
 */
async function deleteCoverLetter(coverLetterId) {
  try{
    return await prisma.CoverLetter.delete({
      where:{
        id: coverLetterId
      },
    });
  } catch(error){
    console.error("Error deleting cover letter:", error);
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
        description: true
      },
    });
  } catch (error) {
    console.error("Error retrieving courses:", error);
    throw error;
  }
}

/**
 * Updates a course in the database or creates a new one if one does not exist with the given course code.
 * @param {object} courseData - An object containing the course code, name, and description.
 * @returns {Promise<object>} A promise that resolves to the created course object.
 */
async function upsertCourse(courseData) {
  const { courseCode, name, description } = courseData;
  try {
    return await prisma.course.upsert({
      where: {
        courseCode: courseCode
      },
      update: {
        name: name,
        description: description,
      },
      create: {
        courseCode: courseCode,
        name: name,
        description: description,
      },
    });
  } catch (error) {
    console.error("Error creating or editing course:", error);
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
  const { jobPositionHistoryId, entries, weekStartDate, isCurrentWeek } =
    timecardData;

  return prisma.$transaction(async (tx) => {
    const jobHistory = await tx.jobPositionHistory.findUnique({
      where: { id: jobPositionHistoryId },
      select: { employeeId: true },
    });
    if (!jobHistory) {
      throw new Error(
        `JobPositionHistory with ID ${jobPositionHistoryId} not found.`
      );
    }
    const { employeeId } = jobHistory;

    // Find or create the weekly container
    let weeklyHistory = await tx.timecardWeeklyHistory.findFirst({
      where: { jobPositionHistoryId, weekStartDate },
    });

    if (!weeklyHistory) {
      weeklyHistory = await tx.timecardWeeklyHistory.create({
        data: { jobPositionHistoryId, weekStartDate, isCurrentWeek: true },
      });
    } else if (isCurrentWeek) {
      // Ensure this week is marked as current if it's being submitted
      await tx.timecardWeeklyHistory.update({
        where: { id: weeklyHistory.id },
        data: { isCurrentWeek: true },
      });
    }

    // Helper to convert time strings to Date objects
    const createDate = (d, time) =>
      time ? new Date(`${d}T${time}:00Z`) : null;

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
          ...dataToUpsert,
        },
      });
    }

    return { success: true, message: "Timecard saved successfully." };
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
            day: "asc",
          },
        },
      },
      orderBy: {
        weekStartDate: "desc",
      },
    });
  } catch (error) {
    console.error(
      `Error fetching all timecards for job ${jobPositionHistoryId}:`,
      error
    );
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
          orderBy: { day: "asc" },
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
                        lname: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        weekStartDate: "desc",
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
            employeeStatus: "ACTIVE",
          },
        },
      },
      include: {
        dailyEntries: {
          orderBy: { day: "asc" },
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
                        lname: true,
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        weekStartDate: "desc",
      },
    });
  } catch (error) {
    console.error(
      `Error fetching employer timecard data for employer ${employerUsername}:`,
      error
    );
    throw error;
  }
}

// =============================================================================
// NOTIFICATION PREFERENCES
// =============================================================================
async function getUserNotificationPreferences(username) {
  // Use centralized notification service exclusively
  const { getPreferences } = require("../utils/notifications");
  const res = await getPreferences(username);
  return { notifyEmail: res.notifyEmail ?? true, notifySlack: res.notifySlack ?? false };
}

async function upsertUserNotificationPreferences(username, notifyEmail, notifySlack) {
  const { setPreferences } = require("../utils/notifications");
  const body = { username, notifyEmail: !!notifyEmail, notifySlack: !!notifySlack };
  return await setPreferences(username, body);
}


// =============================================================================
// EXPORTS & PROCESS HANDLING
// =============================================================================

module.exports = {
  getCandidateApplicationsAsEmployer,
  getCandidateApplications,
  getCandidateApplicationsAsAdmin,
  getAllApplicationsForAdmin,
  deleteCandidateApplication,
  getCandidateApplication,
  getSemesterCodes,
  applyForJobPosition,
  getCandidateHiredStatus,
  changeCandidateApplicationStatus,
  hireCandidateForJobPosition,
  isJobPositionFull,
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
  getResumeById,
  getCandidateResumes,
  addNewCoverLetter,
  getCoverLetterById,
  deleteCoverLetter,
  checkResumeDeleteStatus,
  getAllUsers,
  checkUserAvailability,
  getAllCourses,
  createJobPosition,
  updateJobPosition,
  updateJobPositionStatus,
  getOpenJobPositions,
  getJobPositionsByOwner,
  getAllJobPositions,
  upsertCourse,
  getComments,
  terminateEmployee,
  upsertTimecard,
  getAllTimecardsForJob,
  fetchAdminViewData,
  fetchEmployerViewData,
  getCourseStakeholders,
  getApplicantEmailByApplicationId,
  getApplicationDetailsForNotify,
  getUserNotificationPreferences,
  upsertUserNotificationPreferences,
  updateApplicationNote,
  getApplicationNote
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

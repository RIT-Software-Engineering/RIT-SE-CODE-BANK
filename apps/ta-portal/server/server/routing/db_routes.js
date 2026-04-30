// server/server/routing/db_routes.js

// =============================================================================
// SETUP & IMPORTS
// =============================================================================

const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Import feature flag utilities
const { getAllFeatureFlags, updateFeatureFlag, FEATURES } = require("../config/featureFlags");

// Import all necessary database query functions.
const {
  createJobPosition,
  updateJobPosition,
  updateJobPositionStatus,
  getOpenJobPositions,
  getJobPositionsByOwner,
  getAllJobPositions,
  getAllUsers,
  getAllCourses,
  upsertCourse,
  authenticateUser,
  resetPassword,
  getUser,
  getUserProfile,
  createCandidateProfile,
  updateCandidateProfile,
  createEmployerProfile,
  updateEmployerProfile,
  getCandidateApplicationsAsEmployer,
  getCandidateApplicationsAsAdmin,
  getAllApplicationsForAdmin,
  hireCandidateForJobPosition,
  isJobPositionFull,
  applyForJobPosition,
  addNewCandidateResume,
  updatePrimaryResume,
  deleteResume,
  getResumeById,
  getCandidateResumes,
  updateResumeName,
  getCandidateApplications,
  getSemesterCodes,
  deleteCandidateApplication,
  getCandidateApplication,
  getCandidateHiredStatus,
  changeCandidateApplicationStatus,
  getComments,
  terminateEmployee,
  upsertTimecard,
  getAllTimecardsForJob,
  fetchAdminViewData,
  fetchEmployerViewData,
  getUserNotificationPreferences,
  upsertUserNotificationPreferences,
  addNewCoverLetter,
  getCoverLetterById,
  deleteCoverLetter,
  checkResumeDeleteStatus,
  getApplicationNote,
  updateApplicationNote,
} = require('../database/query_db');

// =============================================================================
// MIDDLEWARE & FILE STORAGE CONFIGURATION
// =============================================================================

// Define the absolute path for storing resumes.
const resumeStoragePath = path.resolve(__dirname, "../../resources/resumes");

// Ensure the base directory for resumes exists, creating it if necessary.
fs.mkdirSync(resumeStoragePath, { recursive: true });

// Define the absolute path for storing cover letters.
const coverLetterStoragePath = path.resolve(__dirname, "../../resources/cover-letters");

// Ensure the base directory for cover letters exists, creating it if necessary.
fs.mkdirSync(coverLetterStoragePath, { recursive: true });

// Configure multer's disk storage engine.
const storage = multer.diskStorage({
  /**
   * Sets the destination folder for the uploaded file.
   * Creates a user-specific subfolder using their username to organize resumes.
   */
  destination: function (req, file, cb) {
    let basePath;

    // Check the fieldname to determine the correct storage path.
    if (file.fieldname === "resumeFile") {
      basePath = resumeStoragePath;
    } else if (file.fieldname === "coverLetterFile") {
      basePath = coverLetterStoragePath;
    } else {
      // If the fieldname is unexpected, return an error.
      return cb(new Error("Invalid file field name"), null);
    }
    
    // Create the user-specific folder inside the correct base path.
    const userFolderPath = path.join(basePath, req.body.candidateUsername);
    fs.mkdirSync(userFolderPath, { recursive: true }); // Ensure the user's folder exists.
    cb(null, userFolderPath);
  },
  /**
   * Generates a unique filename for the uploaded file to prevent naming conflicts.
   * Prepends a timestamp to the original filename.
   */
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now();
    cb(null, `${uniquePrefix}-${file.originalname}`);
  }
});

// Initialize multer with the configured storage, file size limits, and file type filter.
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB file size limit.
  fileFilter: (req, file, cb) => {
    // Only allow PDF files to be uploaded.
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only .pdf files are allowed!"), false);
    }
  },
});

// =============================================================================
// JOB POSITION & APPLICATION ROUTES
// =============================================================================

/**
 * @route   GET /ta-portal-api/db/positions
 * @desc    Searches all job positions, or retrieves all if no queries are provided.
 * @access  Public (Admins get more powerful filtering on the frontend)
 * @query   {string} [searchTerm] - Optional search term.
 * @query   {string} [filters] - Optional URL-encoded JSON string of filter criteria.
 * @returns {Array} An array of all matching job position objects.
 */
router.get("/positions", async (req, res) => {
  try {
    const { searchTerm } = req.query;
    let filters = {};

    if (req.query.filters) {
      try {
        filters = JSON.parse(req.query.filters);
      } catch (e) {
        return res.status(400).json({ error: "Invalid filters format." });
      }
    }

    // Call the new, more powerful search function
    const positions = await getAllJobPositions(searchTerm, filters);
    res.status(200).json(positions);

  } catch (error) {
    console.error("Error in GET /positions route:", error);
    res.status(500).json({ error: "Failed to retrieve positions." });
  }
});

/**
 * @route   GET /ta-portal-api/db/positions/open
 * @desc    Searches and filters all OPEN job positions.
 * @access  Public
 * @query   {string} [searchTerm] - Optional search term.
 * @query   {string} [filters] - Optional URL-encoded JSON string of filter criteria.
 * @query   {string} [candidateUsername] - Optional username for candidate-specific filters.
 * @returns {Array} An array of matching open job position objects.
 */
router.get("/positions/open", async (req, res) => {
  try {
    const { searchTerm, candidateUsername } = req.query;
    let filters = {};

    if (req.query.filters) {
      try {
        filters = JSON.parse(req.query.filters);
      } catch (e) {
        return res.status(400).json({ error: "Invalid filters format. Must be a valid JSON string." });
      }
    }

    const positions = await getOpenJobPositions(searchTerm, filters, candidateUsername);
    res.status(200).json(positions);
    
  } catch (error) {
    console.error("Error in GET /positions/open route:", error);
    res.status(500).json({ error: "Failed to retrieve open positions." });
  }
});

/**
 * @route   GET /ta-portal-api/db/positions/owner/:username
 * @desc    Retrieves job positions owned by a specific user, with optional filters.
 * @access  Public (should be protected by auth middleware)
 * @param   {string} username - The username of the position owner.
 * @query   {string} [searchTerm] - Optional search term.
 * @query   {string} [filters] - Optional URL-encoded JSON string of filter criteria.
 * @returns {Array} An array of matching job position objects.
 */
router.get("/positions/owner/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const { searchTerm } = req.query;
    let filters = {};

    if (req.query.filters) {
      try {
        filters = JSON.parse(req.query.filters);
      } catch (e) {
        return res.status(400).json({ error: "Invalid filters format. Must be a valid JSON string." });
      }
    }

    const positions = await getJobPositionsByOwner(searchTerm, filters, username);
    res.status(200).json(positions);

  } catch (error) {
    console.error(`Error in GET /positions/owner/${req.params.username} route:`, error);
    res.status(500).json({ error: "Failed to retrieve owned positions." });
  }
});

/**
 * @route   POST /ta-portal-api/db/positions
 * @desc    Creates a new job position record.
 * @access  Public
 * @body    {Object} positionData - An object containing job position details.
 * @body    {Object} employerData - An object containing employer details.
 * @returns {Object} The newly created job position object.
 */
router.post("/positions", async (req, res) => {
  try {
    // Expect the request body to contain the two required data objects
    const { positionData, employerData } = req.body;

    // Basic validation to ensure the required data is present
    if (!positionData || !employerData) {
      return res.status(400).json({ error: "Request body must contain 'positionData' and 'employerData' objects." });
    }

    const newPosition = await createJobPosition(positionData, employerData);
    res.status(201).json(newPosition);

  } catch (error) {
    // The db function throws a specific error for duplicates
    if (error.message.includes("already exists")) {
      return res.status(409).json({ error: error.message }); // 409 Conflict
    }
    console.error("Error in POST /positions route:", error);
    res.status(500).json({ error: "Failed to create position." });
  }
});

/**
 * @route   PUT /ta-portal-api/db/positions/:id
 * @desc    Updates an existing job position record.
 * @access  Public
 * @param   {string} id - The ID of the job position to update.
 * @body    {Object} positionData - An object containing updated job position details.
 * @body    {Object} commentData - An object containing updated comment details.
 * @returns {Object} The updated job position object.
 */
router.put("/positions/:id", async (req, res) => {
  try {
    // Get the job ID from the URL parameters
    const { id } = req.params;
    
    // Get the position and comment data from the request body
    const { positionData, commentData } = req.body;

    // Validation
    if (!positionData || !commentData) {
      return res.status(400).json({ error: "Request body must contain 'positionData' and 'commentData' objects." });
    }

    const updatedPosition = await updateJobPosition(id, positionData, commentData);
    res.status(200).json(updatedPosition);

  } catch (error) {
    
    console.error(`Error in PUT /positions/${req.params.id} route:`, error);
    res.status(500).json({ error: "Failed to update position." });
  }
});

/**
 * @route   PUT /ta-portal-api/db/positions/:id/status
 * @desc    Updates only the status of a specific job position.
 * @access  Public (should be protected by auth middleware)
 * @param   {string} id - The ID of the job position to update.
 * @body    {string} status - The new status for the job position.
 * @body    {Object} commentData - An object containing comment details.
 * @returns {Object} The updated job position object.
 */
router.put("/positions/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, commentData } = req.body;

    if (!status || !commentData) {
      return res.status(400).json({ error: "Request body must contain 'status' and 'commentData'." });
    }

    const updatedPosition = await updateJobPositionStatus(id, status, commentData);
    res.status(200).json(updatedPosition);

  } catch (error) {
    console.error(`Error in PUT /positions/${req.params.id}/status route:`, error);
    res.status(500).json({ error: "Failed to update position status." });
  }
});

/**
 * @route   POST /ta-portal-api/db/apply
 * @desc    Creates a new job application record for a candidate using an existing resume.
 * @access  Public
 * @body    {object} jobPositionApplicationData - The application details.
 */
router.post('/apply', async (req, res) => {
  try {
    const applicationDetails = req.body;

    // Validate that the required resumeId is present.
    if (!applicationDetails.resumeId) {
      return res
        .status(400)
        .json({
          error: 'A resumeId is required to apply with an existing resume.',
        });
    }

    const application = await applyForJobPosition(applicationDetails);
    res.status(201).json(application);
  } catch (error) {
    console.error('Error in /apply route:', error);
    res.status(500).json({ error: 'Failed to apply for job position.' });
  }
});

/**
 * @route   POST /ta-portal-api/db/apply-with-uploads
 * @desc    Handles a job application that may include a new resume and/or a cover letter.
 * @access  Public
 */
router.post(
  "/apply-with-uploads", 
  upload.fields([
    { name: "resumeFile", maxCount: 1 },
    { name: "coverLetterFile", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const {
        candidateUsername,
        jobPositionId,
        jobPositionApplicationFormData,
        resumeName,
        resumeId, // Will be present if using an existing resume instead of uploading a new one (only present here for when a user uploads a new cover letter)
        coverLetterName,
      } = req.body;

      // --- Prepare Application Details ---
      const applicationDetails = {
        candidateUsername: candidateUsername,
        resumeId: resumeId,
        jobPositionId: jobPositionId,
        jobPositionApplicationFormData: jobPositionApplicationFormData,
      };

      // --- Handle Resume ---
      // Check if a new resume file was uploaded
      if (req.files && req.files.resumeFile) {
        if (!resumeName) {
          return res.status(400).json({ error: 'New resume name is required.' });
        }
        const resumeFile = req.files.resumeFile[0];
        const newResumeUrl = `/${candidateUsername}/${resumeFile.filename}`;
        
        const existingResumes = await getCandidateResumes(candidateUsername);
        const isPrimary = existingResumes.length === 0;

        const newResume = await addNewCandidateResume(candidateUsername, isPrimary, newResumeUrl, resumeName);
        applicationDetails.resumeId = newResume.id;
      } else if (resumeId) {
        // If no new resume, use the provided resumeId
        applicationDetails.resumeId = parseInt(resumeId, 10);
      } else {
        return res.status(400).json({ error: "A resume must be selected or uploaded." });
      }

      // --- Handle Cover Letter (if uploaded) ---
      if (req.files && req.files.coverLetterFile) {

        const coverLetterFile = req.files.coverLetterFile[0];
        const newCoverLetterUrl = `/${candidateUsername}/${coverLetterFile.filename}`;

        const newCoverLetter = await addNewCoverLetter(candidateUsername,newCoverLetterUrl,(coverLetterName || 'Cover Letter'));
        applicationDetails.coverLetterId = newCoverLetter.id;
      }

      // --- Create the Application ---
      const application = await applyForJobPosition(applicationDetails);
      res.status(201).json(application);

    } catch (error) {
      console.error("Error in file upload application route:", error);
      res.status(500).json({ error: "Failed to process application with files." });
    }
  }
);
  
/**
 * @route   DELETE /ta-portal-api/db/applications/:username
 * @desc    Deletes a job application record for a candidate.
 * @access  Public
 * @param   {string} username - The username of the candidate.
 * @query   {string} jobPositionId - The ID of the job position.
 */
router.delete('/applications/:username', async (req, res) => {
  try {
    const { jobPositionId } = req.query;
    if (!jobPositionId) {
      return res.status(400).json({ message: 'The jobPositionId query parameter is required.' });
    }

    // Get the application details
    const application = await getCandidateApplication(req.params.username, jobPositionId);
    // Delete the cover letter file if it exists
    if (application.coverLetterId) {
      try {
        const coverLetter = await deleteCoverLetter(application.coverLetterId)
        const filePath = path.join(coverLetterStoragePath, coverLetter.coverLetterURL);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          console.log(`Successfully deleted cover letter: ${filePath}`);
        }
        else{
          console.log(`Cover letter file not found: ${filePath}`);
        }
      } catch (err) {
        console.error(`Failed to delete cover letter file for application ${application.id}:`, err);
      }
    }

    // Call the service to delete the database records, using the unique ID
    const deletedApplication = await deleteCandidateApplication(application.id);

    const relatedResume = await getResumeById(deletedApplication.resumeId)
    if (await checkResumeDeleteStatus(deletedApplication.resumeId)){
      const filePath = path.join(resumeStoragePath, relatedResume.resumeURL);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    res.status(200).json(deletedApplication);
  } catch (error) {
    console.error('ta-portal-api Error deleting application:', error);
    res
      .status(500)
      .json({ message: 'An error occurred while deleting the application.' });
  }
});

/**
 * @route   GET /applications/notes/:applicationId
 * @desc    Retrieves the stored application note. Returns an empty string if the entry does not exist.
 */
router.get('/applications/notes/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const note = await getApplicationNote(parseInt(applicationId, 10));
    res.status(200).json(note);
  } catch (error){
    console.error("Error in getting application note.", error);
    res.status(500).json({ error: 'An error occurred while getting application notes.'});
  }
});

/**
 * @route   PUT /applications/notes/:applicationId
 * @desc    Sets the application note for the application. Creates a new entry if one does not exist.
 */
router.put('/applications/notes/:applicationId', async (req, res) => {
  try {
    const { applicationId } = req.params;
    const { newNote } = req.body;
    const note = await updateApplicationNote(parseInt(applicationId, 10),newNote)
    res.status(200).json(note)
  } catch (error){
    console.error("Error in updating application note.", error);
    res.status(500).json({ error: 'An error occurred while updating application notes.'});
  }
});


/**
 * @route   GET /ta-portal-api/db/candidate/:username/hired-status
 * @desc    Retrieves the hired status of a candidate for a specific semester.
 * @access  Public
 * @param   {string} username - The username of the candidate.
 * @query   {string} semesterCode - The code of the semester.
 * @returns {boolean} - The hired status of the candidate.
 */ 
router.get('/candidate/:username/hired-status', async (req, res) => {
  try{
  const { username } = req.params;
  const { semesterCode } = req.query;
  if (!username) {
    return res.status(400).json({ error: 'Candidate username is required.' });
  }
  if (!semesterCode || isNaN(semesterCode)) {
    return res.status(400).json({ error: 'Semester code is required.' });
  }

  const hiredStatus = await getCandidateHiredStatus(username, parseInt(semesterCode, 10));
  res.status(200).json(hiredStatus);
  } catch (error) {
    console.error('Error in /candidate/:username/hired-status route:', error);
    res.status(500).json({ error: 'Failed to retrieve candidate hired status.' });
  }
});

/**
 * @route   PUT /ta-portal-api/db/applications/:id
 * @desc    Updates an existing job application record's status and comments that was initially created by a candidate.
 * @access  Public
 * @param   {string} id - The id of the application.
 * @body    {string} author - The full name of the user making the update.
 * @body    {string} status - The new status of the application.
 * @body    {string} comments - The comments associated with the update.
 */
router.put('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments, author } = req.body;

    // 1. Validate the input from the request.
    if (!status || !id || !author) {
      return res.status(400).json({ error: 'Status, the application id, and the author of who\'s making the update are a required fields.' });
    }
    
    const numericApplicationId = parseInt(id, 10);
    if (isNaN(numericApplicationId)) {
      return res.status(400).json({ error: 'Invalid application id.' });
    }

    // 2. Call the backend function with the validated data.
    const updatedApplication = await changeCandidateApplicationStatus(
      author,
      numericApplicationId,
      status,
      comments
    );

    // 3. Send a success response with the updated data.
    res.status(200).json(updatedApplication);

  } catch (error) {
    // 4. Handle errors gracefully.
    console.error(`Error updating application status for ID ${req.params.id}:`, error);

    // Check for a specific "not found" error message from the service function.
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }

    // For all other errors, send a generic server error response.
    res.status(500).json({ error: 'An error occurred while updating the application status.' });
  }
});

/**
 * @route   GET /ta-portal-api/db/applications/candidate
 * @desc    Retrieves and searches and filters job applications based on query parameters.
 * @access  Public
 * @query   {string} [searchTerm] - Text to search in course names/codes.
 * @query   {string} [filters] - A JSON string of filter criteria.
 * @query   {string} [candidateUsername] - The Username of the candidate for eligibility checks.
 */
router.get('/applications/candidate', async (req, res) => {
  try {
    const { searchTerm, filters: filtersString, candidateUsername } = req.query;
    const filters = filtersString ? JSON.parse(filtersString) : {};
    const applications = await getCandidateApplications(
      searchTerm,
      filters,
      candidateUsername
    );
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error in /applications route:', error.message, error.stack);
    res.status(500).json({ error: 'An error occurred while searching and filtering applications.' });
  }
})

/**
 * @route   GET /ta-portal-api/db/applications/employer
 * @desc    Retrieves and searches and filters job applications based on query parameters.
 * @access  Public
 * @query   {string} [searchTerm] - Text to search in course names/codes.
 * @query   {string} [filters] - A JSON string of filter criteria.
 * @query   {string} [employerUsername] - The Username of the employer for eligibility checks.
 */
router.get('/applications/employer', async (req, res) => {
  try {
    const { searchTerm, searchBy, filters: filtersString, employerUsername } = req.query;
    const filters = filtersString ? JSON.parse(filtersString) : {};

    const applications = await getCandidateApplicationsAsEmployer(
      searchTerm,
      searchBy,
      filters,
      employerUsername
    );
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error in /applications/employer route:', error.message, error.stack);
    res.status(500).json({ error: 'An error occurred while searching and filtering applications.' });
  }
});


/**
 * @route   GET /ta-portal-api/db/semester-codes
 * @desc    Retrieves all unique semester codes. Can be filtered by status or employer.
 * @access  Public
 * @query   {string} [status] - Optional. Filter by job position status.
 * @query   {string} [employer] - Optional. Filter by employer username.
 * @returns {Array} An array of unique semester codes.
 */
router.get('/semester-codes', async (req, res) => {
  try {
    const { status, employer } = req.query;
    const semesterCodes = await getSemesterCodes(status, employer);
    res.status(200).json(semesterCodes);
  } catch (error) {
    console.error('Error in /semester-codes route:', error.message, error.stack);
    res.status(500).json({ error: 'An error occurred while retrieving semester codes.' });
  }
});


/**
 * @route   GET /ta-portal-api/db/applications/admin
 * @desc    Gets all applications with status "ACCEPTED_OFFER" for admin hiring review.
 * @access  Public (should be protected by admin auth middleware)
 * @returns {Array} An array of application objects with job position and resume details.
 */
router.get("/applications/admin", async (req, res) => {
  try {
    const applications = await getCandidateApplicationsAsAdmin();
    res.status(200).json(applications);
  } catch (error) {
    console.error("Error in GET /applications/admin route:", error);
    res.status(500).json({ error: "Failed to retrieve applications for admin." });
  }
});

/**
 * @route   GET /ta-portal-api/db/applications/admin/all
 * @desc    Gets ALL applications across the system for admin viewing, with search and filters.
 * @access  Public (should be protected by admin auth middleware)
 * @query   {string} search - Search term for course code/name or student name.
 * @query   {string} searchType - Type of search ("course" or "student").
 * @query   {string} status - Comma-separated list of statuses to filter by.
 * @query   {string} level - Comma-separated list of grade levels to filter by.
 * @query   {string} semester - Semester code to filter by.
 * @query   {string} hasApplications - Filter positions with/without applications ("yes", "no").
 * @returns {Array} An array of job positions with their application history.
 */
router.get("/applications/admin/all", async (req, res) => {
  try {
    const { search = '', searchType = 'course', status, level, semester, hasApplications } = req.query;

    // Validate searchType
    const validSearchTypes = ['course', 'student'];
    if (searchType && !validSearchTypes.includes(searchType)) {
      return res.status(400).json({ error: 'Invalid searchType. Must be "course" or "student".' });
    }

    // Parse comma-separated filters
    const statusArray = status ? status.split(',').map(s => s.trim()) : [];
    const levelArray = level ? level.split(',').map(l => l.trim()) : [];

    const filters = {
      status: statusArray,
      level: levelArray,
      semester: semester || '',
      hasApplications: hasApplications || '',
    };

    const positions = await getAllApplicationsForAdmin(search, searchType, filters);
    res.status(200).json(positions);
  } catch (error) {
    console.error("Error in GET /applications/admin/all route:", error);
    res.status(500).json({ error: "Failed to retrieve all applications for admin." });
  }
});

/**
 * @route   GET /ta-portal-api/db/positions/:id/is-full
 * @desc    Checks if a job position is full (status is 'FILLED' or 'ACTIVE').
 * @access  Public (should be protected by auth middleware)
 * @param   {string} id - The ID of the job position to check.
 * @returns {Object} An object containing the isFull boolean result.
 */
router.get("/positions/:id/is-full", async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({ error: "Job position ID is required." });
    }

    const isFull = await isJobPositionFull(id);
    res.status(200).json({ isFull });
  } catch (error) {
    console.error(`Error in GET /positions/${req.params.id}/is-full route:`, error);
    res.status(500).json({ error: "Failed to check if job position is full." });
  }
});

/**
 * @route   POST /ta-portal-api/db/hire
 * @desc    Hires a candidate for a job position and promotes them to employee.
 * @access  Public (should be protected by admin auth middleware)
 * @body    {string} candidateUsername - The username of the candidate to hire.
 * @body    {string} applicationId - The ID of the application record.
 * @body    {string} jobPositionId - The ID of the job position.
 * @body    {number} employeeId - The employee ID to assign.
 * @body    {Object} commentData - Comment data for the hiring action.
 * @returns {Object} The updated application record.
 */
router.post("/hire", async (req, res) => {
  try {
    const { candidateUsername, applicationId, jobPositionId, employeeId, commentData } = req.body;

    // Validate required fields
    if (!candidateUsername || !applicationId || !jobPositionId || !employeeId || !commentData) {
      return res.status(400).json({ 
        error: "Missing required fields: candidateUsername, applicationId, jobPositionId, employeeId, and commentData are all required." 
      });
    }

    // Validate commentData structure
    if (!commentData.author || !commentData.comment) {
      return res.status(400).json({ 
        error: "commentData must contain 'author' and 'comment' fields." 
      });
    }

    // Validate employeeId is a number
    if (typeof employeeId !== 'number' || isNaN(employeeId)) {
      return res.status(400).json({ 
        error: "employeeId must be a valid number." 
      });
    }

    const updatedApplication = await hireCandidateForJobPosition(
      candidateUsername, 
      parseInt(applicationId), 
      jobPositionId, 
      employeeId, 
      commentData
    );
    
    res.status(200).json(updatedApplication);
  } catch (error) {
    console.error("Error in POST /hire route:", error);
    
    // Handle specific error cases
    if (error.message.includes("not found")) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: "Failed to hire candidate." });
  }
});

// =============================================================================
// USER & PROFILE ROUTES
// =============================================================================

/**
 * @route   GET /ta-portal-api/db/users
 * @desc    Retrieves a list of all users.
 * @access  Public
 */
router.get('/users', async (req, res, next) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    // Log and forward to central error handler so it can include name/stack
    console.error('Error in /users route:', error);
    next(error);
  }
});

/**
 * @route   GET /ta-portal-api/db/user/:username
 * @desc    Retrieves a user's profile by their username.
 * @access  Public
 * @param   {string} username - The user's unique identifier.
 * @returns {object} The user profile given in the users table.
 */
router.get('/user/:username', async (req, res) => {
  try {
    const user = await getUser(req.params.username);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(404).json({ error: 'User not found.' });
    }
  } catch (error) {
    console.error('Error in /user route:', error);
    res.status(500).json({ error: 'Failed to retrieve user.' });
  }
});

/**
 * @route   POST /ta-portal-api/db/login
 * @desc    Authenticates a user and returns their profile.
 * @access  Public
 * @body    {string} username - The username of the user.
 * @body    {string} password - The password of the user.
 * @returns {object} The authenticated user's profile.
 */
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await authenticateUser(username, password);
    if (user) {
      res.status(200).json(user);
    } else {
      res.status(401).json({ error: 'Invalid username or password.' });
    }
  } catch (error) {
    console.error('Error in /login route:', error);
    res.status(500).json({ error: 'Failed to authenticate user.' });
  }
})

/**
 * @route   POST /ta-portal-api/db/reset-password
 * @desc    Sets a new password using a reset token.
 * @access  Public
 * @body    {string} token - The password reset token.
 * @body    {string} newPassword - The new password.
 */
router.post('/reset-password', async (req, res) => {
  const { username, newPassword } = req.body;
  if (!username || !newPassword) {
    return res.status(400).json({ error: 'Username and new password are required.' });
  }

  try {
    const user = await resetPassword(username, newPassword);
    
    if (!user) {
      return res.status(400).json({ error: 'User does not exist.' });
    }

    res.status(200).json({ message: 'Password reset successfully.' });
  } catch (error) {
    console.error('Error in force-reset-password route:', error);
    res.status(500).json({ error: 'An internal server error occurred.' });
  }
});

/**
 * @route   GET /ta-portal-api/db/users/:username
 * @desc    Retrieves a single user's profile by their username.
 * @access  Public
 * @param   {string} username - The user's unique identifier.
 */
router.get('/user-profile/:username', async (req, res) => {
  try {
    const user = await getUserProfile(req.params.username);
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error in /user-profile/${req.params.username} route:`, error);
    res.status(500).json({ error: 'Failed to retrieve user.' });
  }
});

/**
 * @route   POST /ta-portal-api/db/candidate-profile
 * @desc    Creates a new candidate profile.
 * @access  Public (or protected, depending on your auth rules)
 * @body    {object} candidateData - The full profile data for the new candidate.
 */
router.post('/candidate-profile', async (req, res) => {
  try {
    // Validate incoming payload for required candidate fields before calling DB layer.
    const candidateData = req.body || {};
    const required = ['username', 'password', 'fname', 'lname', 'email', 'year'];
    const missing = required.filter((k) => !(k in candidateData) || candidateData[k] === undefined || candidateData[k] === null || candidateData[k] === '');
    if (missing.length > 0) {
      return res.status(400).json({ error: `Missing required fields: ${missing.join(', ')}` });
    }

    const newProfile = await createCandidateProfile(candidateData);
    res.status(201).json(newProfile); // 201 Created is the standard status for success
  } catch (error) {
    console.error("Error in POST /candidate-profile route:", error);
    // Check for specific Prisma error for unique constraints (e.g., username taken)
    if (error && error.code === 'P2002') {
      const target = error.meta && Array.isArray(error.meta.target) ? error.meta.target.join(', ') : (error.meta ? JSON.stringify(error.meta) : 'unique field');
      return res.status(409).json({ error: `A user with this ${target} already exists.` });
    }
    res.status(500).json({ error: "Failed to create candidate profile." });
  }
});

/**
 * @route   PUT /ta-portal-api/db/candidate-profile/:username
 * @desc    Updates an existing candidate's profile.
 * @access  Public (or protected)
 * @param   {string} username - The unique identifier of the user to update.
 * @body    {object} candidateData - The profile data fields to be updated.
 */
router.put('/candidate-profile/:username', async (req, res) => {
  try {
    // Combine the Username from the URL with the update data from the body
    const dataToUpdate = { ...req.body, username: req.params.username };

    const updatedProfile = await updateCandidateProfile(dataToUpdate);
    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error(`Error in PUT /candidate-profile/${req.params.username} route:`, error);
    res.status(500).json({ error: "Failed to update candidate profile." });
  }
});

/**
 * @route   POST /ta-portal-api/db/employer-profile
 * @desc    Creates a new employer profile.
 * @access  Public (or protected)
 * @body    {object} employerData - The full profile data for the new employer.
 */
router.post("/employer-profile", async (req, res) => {
  try {
    const newProfile = await createEmployerProfile(req.body);
    res.status(201).json(newProfile);
  } catch (error) {
    console.error("Error in POST /employer-profile route:", error);
    if (error && error.code === 'P2002') {
      const target = error.meta && Array.isArray(error.meta.target) ? error.meta.target.join(', ') : (error.meta ? JSON.stringify(error.meta) : 'unique field');
      return res.status(409).json({ error: `A user with this ${target} already exists.` });
    }
    res.status(500).json({ error: "Failed to create employer profile." });
  }
});

/**
 * @route   PUT /ta-portal-api/db/employer-profile/:username
 * @desc    Updates an existing employer's profile.
 * @access  Public (or protected)
 * @param   {string} username - The unique identifier of the user to update.
 * @body    {object} employerData - The profile data fields to be updated.
 */
router.put("/employer-profile/:username", async (req, res) => {
  try {
    // Combine the Username from the URL with the update data from the body
    const dataToUpdate = { ...req.body, username: req.params.username };

    const updatedProfile = await updateEmployerProfile(dataToUpdate);
    res.status(200).json(updatedProfile);
  } catch (error) {
    console.error(`Error in PUT /employer-profile/${req.params.username} route:`, error);
    res.status(500).json({ error: "Failed to update employer profile." });
  }
});

/**
 * @route   PUT /ta-portal-api/db/terminate-employee/:username
 * @desc    Terminates an employee by updating their job history to 'TERMINATED'.
 * @access  Public
 * @param   {number} username - The employee's username.
 */
router.put('/terminate-employee/:username', async (req, res) => {
  try {

    const result = await terminateEmployee(req.params.username);

    res.status(200).json({
      message: `Employee ${req.params.username} terminated successfully.`,
      user: result,
    });
  } catch (error) {
    console.error(`Error in /terminate-employee/${req.params.username}:`, error);
    res.status(500).json({ error: 'Failed to terminate employee.' });
  }
});

// =============================================================================
// RESUME ROUTES
// =============================================================================

/**
 * @route   POST /ta-portal-api/db/resume
 * @desc    Adds a new resume for a candidate.
 * @access  Public
 */
router.post('/resume', upload.single('resumeFile'), async (req, res) => {
    try {

      console.log("Incoming /resume request");
      console.log("Body:", req.body);
      console.log("File:", req.file);
      if (!req.file) {
        return res.status(400).json({ error: 'Resume file is required.' });
      }

      const { candidateUsername, name } = req.body;
      if (!candidateUsername || !name) {
        fs.unlinkSync(req.file.path);
        return res
          .status(400)
          .json({ error: 'Candidate Username and resume name are required.' });
      }

      const resumeURL = `/${candidateUsername}/${req.file.filename}`;

      const existingResumes = await getCandidateResumes(candidateUsername);
      const isPrimary = existingResumes.filter(resume => !resume.isSoftDeleted).length === 0;

      const newResume = await addNewCandidateResume(candidateUsername, isPrimary, resumeURL, name);

      res.status(201).json(newResume);
    } catch (error) {
      console.error('Error in /add-new-candidate-resume route:', error);
      res.status(500).json({error: 'Failed to upload and save resume.'});
    }
  }
);

/**
 * @route   GET /ta-portal-api/db/resume/:resumeId
 * @desc    Retrieves the resume with the matching id
 * @access  Public
 */
router.get('/resume/:resumeId', async (req, res) => {
    try{
      console.log("Attempt to get resume with id",req.params.resumeId);
      const resumeEntry = await getResumeById(parseInt(req.params.resumeId));

      if(!resumeEntry){
        return res.status(404).json({error: 'Resume with given ID cannot be found in database.'});
      }

      const filePath = path.join(resumeStoragePath,resumeEntry.resumeURL);

      if(!fs.existsSync(filePath)){
        return res.status(404).json({error: 'Resume with given ID does not have corresponding file.'});
      }

      res.sendFile(filePath);

    } catch (error) {
      console.error('Error in getting resume:', error);
      res.status(500).json({ error: 'Failed to get resume.'});
    }
  }
);

/**
 * @route   GET /ta-portal-api/db/cover-letter/:coverLetterId
 * @desc    Retrieves the coverletter with the matching id
 * @access  Public
 */
router.get('/cover-letter/:coverLetterId', async (req, res) => {
    try{
      const coverLetterEntry = await getCoverLetterById(parseInt(req.params.coverLetterId));

      if(!coverLetterEntry){
        return res.status(404).json({error: 'Cover letter with given ID cannot be found in database.'});
      }

      const filePath = path.join(coverLetterStoragePath,coverLetterEntry.coverLetterURL);

      if(!fs.existsSync(filePath)){
        return res.status(404).json({error: 'Cover letter with given ID does not have corresponding file.'});
      }

      res.sendFile(filePath);

    } catch (error) {
      console.error('Error in getting cover letter:', error);
      res.status(500).json({ error: 'Failed to get cover letter.'});
    }
  }
);

/**
 * @route   Update /ta-portal-api/db/primary-resume/:candidateUsername/:resumeId
 * @desc    Updates the primary resume by its ID.
 * @access  Public
 */
router.put('/primary-resume/:candidateUsername/:resumeId', async (req, res) => {
    try {
      const resumeId = parseInt(req.params.resumeId, 10);
      const updatedResume = await updatePrimaryResume(req.params.candidateUsername, resumeId);
      res.status(200).json(updatedResume);
    } catch (error) {
      console.error('Error in /update-primary-resume route:', error);
      res.status(500).json({ error: 'Failed to update primary resume.' });
    }
  }
);

/**
 * @route Update /ta-portal-api/db/resume-name/:resumeId
 * @desc Updates the name of a resume by its ID.
 * @access Public
 */
router.put('/resume-name/:resumeId', async (req, res) => {
  try{
    const resumeId = parseInt(req.params.resumeId, 10);
    const name = req.body.name;
    const updatedResume = await updateResumeName(resumeId, name);
    res.status(200).json(updatedResume);
  } catch (error) {
    console.error('Error in /update-resume-name route:', error);
    res.status(500).json({ error: 'Failed to update resume name.' });
  }
})

/**
 * @route   DELETE /ta-portal-api/db/resume/:resumeId
 * @desc    Marks resume as deleted, removing the file and entry only if it is not used in any applications
 * @access  Public
 */
router.delete('/resume/:resumeId', async (req, res) => {
  try {
    const resumeId = parseInt(req.params.resumeId, 10);
    if (isNaN(resumeId)) {
      // 1. Send response and stop execution for invalid input
      return res.status(400).json({ error: 'Invalid Resume ID.' });
    }

    const deletedResume = await deleteResume(resumeId);

    // --- File Cleanup Step ---
    // If resume was hard deleted, remove the pdf file as well
    if ((!deletedResume.isSoftDeleted) && deletedResume.resumeURL) {
        const filePath = path.join(resumeStoragePath, deletedResume.resumeURL);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
          //Success: DB entry and file were deleted. Send response and stop.
          return res.status(200).json({ 
            message: 'Resume and associated file deleted successfully.', 
            deletedResume 
          });
        } else {
          // Partial Success: DB entry deleted, file was missing. This is still a success.
          // Send a descriptive message and stop execution.
          return res.status(200).json({ 
            message: 'Resume deleted from database, but its associated file was not found on the server.', 
            deletedResume 
          });
        }
    } else {
      // Success: Resume soft deleted or there is no file to delete.
      return res.status(200).json({ 
        message: 'Resume marked as deleted. No file to remove or file is still used in applications.', 
        deletedResume 
      });
    }

  } catch (error) {
    console.error('Error in /delete-resume route:', error.message);

    // Handle specific errors from the DB function

    if (error.message === 'Resume not found.') {
        return res.status(404).json({ error: 'Resume not found.' });
    }
    
    // Fallback for any other unexpected errors
    return res.status(500).json({ error: 'An unexpected server error occurred.' });
  }
});

// =============================================================================
// GENERAL & UTILITY ROUTES
// =============================================================================

/**
 * @route   GET /ta-portal-api/db/courses
 * @desc    Retrieves a list of all available courses.
 * @access  Public
 */
router.get('/courses', async (req, res) => {
  try {
    const courses = await getAllCourses();
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error in /courses route:', error);
    res.status(500).json({ error: 'Failed to retrieve courses.' });
  }
});

/**
 * @route   GET /ta-portal-api/db/comments
 * @desc    Retrieves comments for a specific table and foreign key.
 * @access  Public
 */
router.get('/comments', async (req, res) => {
  try {
    const tableName = req.query.tableName;
    const foreignKey = req.query.foreignKey;
    const comments = await getComments(tableName, foreignKey);
    res.status(200).json(comments);
  } catch (error) {
    console.error('Error in /comments route:', error);
    res.status(500).json({ error: 'Failed to retrieve comments.' });
  }
});

/**
 * @route   POST /ta-portal-api/db/upsert-course
 * @desc    Updates or Creates a new course with the provided data.
 * @access  Public
 */
router.post("/upsert-course", async (req, res) => {
  try {
    const courseData = req.body;
    const newCourse = await upsertCourse(courseData);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error in /upsert-course route:", error);
    res.status(500).json({ error: "Failed to upsert course." });
  }
});

// =============================================================================
// TIMECARD ROUTES
// =============================================================================


/**
 * @route   POST /upsert-timecard
 * @desc    Creates or updates an employee's weekly timecard with daily entries.
 * @access  Public
 */
router.post("/upsert-timecard", async (req, res) => {
  try {
    const timecardData = req.body;
    // Basic validation to ensure the required data is present.
    if (!timecardData || !timecardData.jobPositionHistoryId || !timecardData.entries) {
      return res.status(400).json({ error: "Invalid or incomplete timecard data provided." });
    }
    const result = await upsertTimecard(timecardData);
    res.status(200).json(result);
  } catch (error) {
    console.error("Error in /upsert-timecard route:", error);
    res.status(500).json({ error: "Failed to save the timecard." });
  }
});

/**
 * @route   GET /ta-portal-api/db/timecard/all/:jobPositionHistoryId
 * @desc    Retrieves all timecards for a specific job position history.
 * @access  Public
 */
router.get('/timecard/all/:jobPositionHistoryId', async (req, res) => {
    try {
        const { jobPositionHistoryId } = req.params;
        if (!jobPositionHistoryId) {
            return res.status(400).json({ error: "Job Position History ID is required." });
        }

        // The ID from params is a string, so parse it to an integer
        const id = parseInt(jobPositionHistoryId, 10);
        const timecards = await getAllTimecardsForJob(id);
        
        res.status(200).json(timecards);
    } catch (error) {
        console.error('Failed to fetch all timecards:', error);
        res.status(500).json({ message: 'Failed to retrieve timecard history.' });
    }
});

/**
 * @route   GET /ta-portal-api/db/timecard/admin/all
 * @desc    Retrieves all timecards for the admin view.
 */
router.get("/timecard/admin/all", async (req, res) => {
    try {
      const allTimecards = await fetchAdminViewData();
      res.status(200).json(allTimecards);
    } catch (error) {
      console.error("Error in /timecard/admin/all route:", error);
      res.status(500).json({ error: "Failed to retrieve admin timecard data." });
    }
});

/**
 * @route   GET /ta-portal-api/db/timecard/employer/:employerUsername
 * @desc    Retrieves all timecards for a specific employer's employees.
 * @param   {string} employerUsername - The RIT username of the employer.
 */
router.get("/timecard/employer/:employerUsername", async (req, res) => {
    try {
      const { employerUsername } = req.params;
      if (!employerUsername) {
          return res.status(400).json({ error: "Employer username is required." });
      }
      const timecards = await fetchEmployerViewData(employerUsername);
      res.status(200).json(timecards);
    } catch (error) {
      console.error(`Error in /timecard/employer/${req.params.employerUsername} route:`, error);
      res.status(500).json({ error: "Failed to retrieve employer timecard data." });
    }
});

/**
 * @route   GET /ta-portal-api/db/notifications/preferences
 * @desc    Returns the current user's notification preferences.
 * @access  Public (replace with auth middleware when available)
 */
router.get("/notifications/preferences", async (req, res) => {
  const { username } = req.query;
  if (!username) return res.status(400).json({ error: "Username required" });
  try {
    const prefs = await getUserNotificationPreferences(username);
    res.json(prefs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

/**
 * @route   PUT /ta-portal-api/db/notifications/preferences
 * @desc    Creates or updates the user's notification preferences.
 * @body    {string} username - The user’s username.
 * @body    {boolean} notifyEmail
 * @body    {boolean} notifySlack
 */
router.put("/notifications/preferences", async (req, res) => {
  const { username, notifyEmail, notifySlack } = req.body;
  if (!username) return res.status(400).json({ error: "Username required" });
  try {
    await upsertUserNotificationPreferences(username, notifyEmail, notifySlack);
    res.sendStatus(204); //success with no response body
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// =============================================================================
// FEATURE FLAGS ROUTES
// =============================================================================

/**
 * @route   GET /ta-portal-api/db/feature-flags
 * @desc    Get all feature flags and their current status
 * @access  Admin only (should add authentication middleware in production)
 * @returns {JSON} Object mapping feature names to enabled status
 */
router.get("/feature-flags", async (req, res) => {
  try {
    const flags = await getAllFeatureFlags();
    res.json(flags);
  } catch (error) {
    console.error("Error fetching feature flags:", error);
    res.status(500).json({ error: "Failed to fetch feature flags." });
  }
});

/**
 * @route   PUT /ta-portal-api/db/feature-flags/:featureName
* @desc    Update a feature flag's enabled status
 * @access  Admin only (should add authentication middleware in production)
 * @body    {boolean} enabled - Whether the feature should be enabled
 * @returns {JSON} Updated feature flag record
 */
router.put("/feature-flags/:featureName", async (req, res) => {
  try {
    const { featureName } = req.params;
    const { enabled } = req.body;

// Validate feature name
    if (!Object.values(FEATURES).includes(featureName)) {
      return res.status(400).json({ error: "Invalid feature name." });
    }

// Validate enabled value
    if (typeof enabled !== "boolean") {
      return res.status(400).json({ error: "Enabled must be a boolean value." });
    }

    const updatedFlag = await updateFeatureFlag(featureName, enabled);
    res.json(updatedFlag);
  } catch (error) {
    console.error("Error updating feature flag:", error);
    res.status(500).json({ error: "Failed to update feature flag." });
  }
});

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = router;
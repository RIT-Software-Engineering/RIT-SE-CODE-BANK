// server/server/routing/db_routes.js

// =============================================================================
// SETUP & IMPORTS
// =============================================================================

const router = require("express").Router();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Import all necessary database query functions.
const {
  getAllUsers,
  getAllCourses,
  createCourse,
  getUserProfile,
  upsertCandidateProfile,
  upsertEmployerProfile,
  getOpenJobPositions,
  getCandidateApplicationsAsEmployer,
  applyForJobPosition,
  addNewCandidateResume,
  updatePrimaryResume,
  deleteResume,
  getCandidateResumes,
  updateResumeName,
  getCandidateApplications,
  modifyPosition,
  getAllPositions,
  getSemesterCodesForEmployer,
  deleteCandidateApplication,
  getCandidateApplication,
  changeCandidateApplicationStatus,
  getComments,
  createPosition,
  terminateEmployee,
  upsertTimecard,
  upsertTimecardDay,
  getMostRecentTimecard,
  getEmployeeTimecard,
  getAllTimecardsForJob,
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
   * Creates a user-specific subfolder using their UID to organize resumes.
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
    const userFolderPath = path.join(basePath, req.body.candidateUID);
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
 * @route   GET /api/db/open-positions
 * @desc    Retrieves and searches and filters open job positions based on query parameters.
 * @access  Public
 * @query   {string} [searchTerm] - Text to search in course names/codes.
 * @query   {string} [filters] - A JSON string of filter criteria.
 * @query   {string} [candidateUID] - The UID of the candidate for eligibility checks.
 */
router.get('/open-positions', async (req, res) => {
  const { searchTerm, filters: filtersString, candidateUID } = req.query;
  try {
    const filters = filtersString ? JSON.parse(filtersString) : {};
    const numericCandidateUID = parseInt(candidateUID, 10);
    if (isNaN(numericCandidateUID)) {
      return res
        .status(400)
        .json({ error: 'Candidate UID must be a valid number.' });
    }
    const positions = await getOpenJobPositions(
      searchTerm,
      filters,
      numericCandidateUID
    );
    res.status(200).json(positions);
  } catch (error) {
    console.error('Error in /open-positions route:', error);
    res
      .status(500)
      .json({ error: 'Failed to search or filter open positions.' });
  }
});

router.put("/modify-position/:id", async (req, res) => {
  try {
    // This is the critical step.
    // It pulls the 'id' property out into its own variable.
    // Everything else goes into the 'positionData' object.
    const { id, ...positionData } = req.body;

    // Check if the ID was actually in the request body.
    if (!id) {
      return res.status(400).json({ error: "Job position ID is required in the request body." });
    }

    // Now, call your database function with the correct arguments:
    // 1. The ID string
    // 2. The object with the rest of the data
    const position = await modifyPosition(id, positionData);
    
    res.status(200).json(position);

  } catch (error) {
    console.error("Error in /modify-position route: ", error);
    res.status(500).json({ error: "Failed to update position" });
  }
});

router.post("/create-position", async (req, res) => {
  try{
    const positionData = req.body;
    console.log("Created position:", positionData);

    const position = await createPosition(positionData,positionData.EmployerUID);
    console.log("Route call with employer: ", positionData.EmployerUID);
    res.status(201).json(position);
  } catch (error) {
    console.error("Error in /create-position route:", error);
    res.status(500).json({ error: "Failed to create position." });
  }
})

router.get("/positions", async (req, res) => {
  try {
    const positions = await getAllPositions();
    res.status(200).json(positions);
  } catch (error) {
    console.error("Error in /positions route:", error);
    res.status(500).json({ error: "Failed to retrieve positions." });
  }
});

/**
 * @route   POST /api/db/apply
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
 * @route   POST /api/db/apply-with-uploads
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
        candidateUID,
        jobPositionId,
        jobPositionApplicationFormData,
        resumeName,
        resumeId, // Will be present if using an existing resume instead of uploading a new one (only present here for when a user uploads a new cover letter)
        coverLetterName,
      } = req.body;

      // --- Prepare Application Details ---
      const numericCandidateUID = parseInt(candidateUID, 10);
      if (isNaN(numericCandidateUID)) {
        return res
          .status(400)
          .json({ error: 'Candidate UID must be a valid number.' });
      }

      const applicationDetails = {
        candidateUID: numericCandidateUID,
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
        const newResumeUrl = `/resources/resumes/${candidateUID}/${resumeFile.filename}`;
        
        const existingResumes = await getCandidateResumes(numericCandidateUID);
        const isPrimary = existingResumes.length === 0;

        const newResume = await addNewCandidateResume(numericCandidateUID, isPrimary, newResumeUrl, resumeName);
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
        applicationDetails.coverLetterURL = `/resources/cover-letters/${candidateUID}/${coverLetterFile.filename}`;
        applicationDetails.coverLetterName = coverLetterName || 'Cover Letter'; // Use provided name or a default
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
 * @route   DELETE /api/db/applications/:uid
 * @desc    Deletes a job application record for a candidate.
 * @access  Public
 * @param   {string} uid - The UID of the candidate.
 * @param   {string} jobPositionId - The ID of the job position.
 */
router.delete('/applications/:uid', async (req, res) => {
  try {
    const candidateUID = parseInt(req.params.uid, 10);
    if (isNaN(candidateUID)) {
      return res.status(400).json({ message: 'A valid numeric candidate UID is required.' });
    }

    const { jobPositionId } = req.query;
    if (!jobPositionId) {
      return res.status(400).json({ message: 'The jobPositionId query parameter is required.' });
    }

    // Get the application details
    const application = await getCandidateApplication(candidateUID, jobPositionId);

    // Delete the cover letter file if it exists
    if (application.coverLetterURL) {
      try {
        const serverRootPath = path.join(__dirname, '..', '..');
        const filePath = path.join(serverRootPath, application.coverLetterURL);
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

    res.status(200).json(deletedApplication);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return res.status(404).json({ message: 'Application not found.' });
    }
    console.error('API Error deleting application:', error);
    res
      .status(500)
      .json({ message: 'An error occurred while deleting the application.' });
  }
});

/**
 * @route   PUT /api/db/applications/:id
 * @desc    Updates a job application record's status for a candidate.
 * @access  Public
 * @param   {string} id - The id of the application.
 * @body    {string} status - The new status of the application.
 * @body    {string} comments - The comments associated with the update.
 */
router.put('/applications/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, comments } = req.body;

    // 1. Validate the input from the request.
    if (!status || !id) {
      return res.status(400).json({ error: 'Status and the application id are a required fields.' });
    }
    
    const numericApplicationId = parseInt(id, 10);
    if (isNaN(numericApplicationId)) {
      return res.status(400).json({ error: 'Invalid application id.' });
    }

    // Comments can be optional, so we'll provide a default if not present.
    const commentText = comments || 'The status has been updated for this application.';

    // 2. Call the backend function with the validated data.
    const updatedApplication = await changeCandidateApplicationStatus(
      numericApplicationId,
      status,
      commentText
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
 * @route   GET /api/db/applications/candidate
 * @desc    Retrieves and searches and filters job applications based on query parameters.
 * @access  Public
 * @query   {string} [searchTerm] - Text to search in course names/codes.
 * @query   {string} [filters] - A JSON string of filter criteria.
 * @query   {string} [candidateUID] - The UID of the candidate for eligibility checks.
 */
router.get('/applications/candidate', async (req, res) => {
  try {
    const { searchTerm, filters: filtersString, candidateUID } = req.query;
    const filters = filtersString ? JSON.parse(filtersString) : {};
    const numericCandidateUID = parseInt(candidateUID, 10);
    if (isNaN(numericCandidateUID)) {
      return res
        .status(400)
        .json({ error: 'Candidate UID must be a valid number.' });
    }
    const applications = await getCandidateApplications(
      searchTerm,
      filters,
      numericCandidateUID
    );
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error in /applications route:', error.message, error.stack);
    res.status(500).json({ error: 'An error occurred while searching and filtering applications.' });
  }
})

/**
 * @route   GET /api/db/applications/employer
 * @desc    Retrieves and searches and filters job applications based on query parameters.
 * @access  Public
 * @query   {string} [searchTerm] - Text to search in course names/codes.
 * @query   {string} [filters] - A JSON string of filter criteria.
 * @query   {string} [employerUID] - The UID of the employer for eligibility checks.
 */
router.get('/applications/employer', async (req, res) => {
  try {
    const { searchTerm, searchBy, filters: filtersString, employerUID } = req.query;
    const filters = filtersString ? JSON.parse(filtersString) : {};
    
    // Ensure employerUID is a number before proceeding
    const numericEmployerUID = parseInt(employerUID, 10);
    if (isNaN(numericEmployerUID)) {
      return res.status(400).json({ error: 'Employer UID must be a valid number.' });
    }

    const applications = await getCandidateApplicationsAsEmployer(
      searchTerm,
      searchBy,
      filters,
      numericEmployerUID
    );
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error in /applications/employer route:', error.message, error.stack);
    res.status(500).json({ error: 'An error occurred while searching and filtering applications.' });
  }
});


/**
 * @route   GET /api/db/semester-codes
 * @desc    Retrieves all applications for job positions managed by a specific employer.
 * @access  Public
 * @param   {string} employerUid - The UID of the employer.
 * @returns {Array} An array of unique semester codes.
 */ 
router.get('/semester-codes/:employerUID', async (req, res) => {
  try {
    const employerUid = parseInt(req.params.employerUID, 10);
    if (isNaN(employerUid)) {
      return res
        .status(400)
        .json({ error: 'Employer UID must be a valid number.' });
    }
    const applications = await getSemesterCodesForEmployer(employerUid);
    res.status(200).json(applications);
  } catch (error) {
    console.error('Error in /semester-codes route:', error.message, error.stack);
    res.status(500).json({ error: 'An error occurred while searching and filtering applications.' });
  }
})

// =============================================================================
// USER & PROFILE ROUTES
// =============================================================================

/**
 * @route   GET /api/db/users
 * @desc    Retrieves a list of all users.
 * @access  Public
 */
router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error in /users route:', error);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

/**
 * @route   GET /api/db/users/:UID
 * @desc    Retrieves a single user's profile by their UID.
 * @access  Public
 * @param   {string} UID - The user's unique identifier.
 */
router.get('/users/:UID', async (req, res) => {
  const { UID } = req.params;
  try {
    const numericUID = parseInt(UID, 10);
    if (isNaN(numericUID)) {
      return res
        .status(400)
        .json({ error: "User UID must be a valid number." });
    }
    const user = await getUserProfile(numericUID);
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error in /users/${UID} route:`, error);
    res.status(500).json({ error: 'Failed to retrieve user.' });
  }
});

/**
 * @route   POST /api/db/upsert-candidate-profile
 * @desc    Creates or updates a candidate's profile.
 * @access  Public
 * @body    {object} candidateData - The full profile data for the candidate.
 */
router.post('/upsert-candidate-profile', async (req, res) => {
  const candidateData = req.body;
  try {
    const profile = await upsertCandidateProfile(candidateData);
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error in /upsert-candidate-profile route:", error);
    res.status(500).json({ error: "Failed to upsert candidate profile." });
  }
});

/**
 * @route   POST /api/db/upsert-employer-profile
 * @desc    Creates or updates an employer's profile.
 * @access  Public
 * @body    {object} employerData - The full profile data for the employer.
 */
router.post("/upsert-employer-profile", async (req, res) => {
  const employerData = req.body;
  try {
    const profile = await upsertEmployerProfile(employerData);
    res.status(200).json(profile);
  } catch (error) {
    console.error("Error in /upsert-employer-profile route:", error);
    res.status(500).json({ error: "Failed to upsert employer profile." });
  }
});

/**
 * @route   PUT /api/db/terminate-employee/:uid
 * @desc    Terminates an employee by updating their job history to 'TERMINATED'.
 * @access  Public
 * @param   {number} uid - The employee's UID.
 */
router.put('/terminate-employee/:uid', async (req, res) => {
  try {
    const { uid } = req.params;
    const numericUID = parseInt(uid, 10);

    if (isNaN(numericUID)) {
      return res.status(400).json({ error: 'UID must be a valid number.' });
    }

    const result = await terminateEmployee(numericUID); // <- Your new query function

    res.status(200).json({
      message: `Employee ${numericUID} terminated successfully.`,
      user: result,
    });
  } catch (error) {
    console.error(`Error in /terminate-employee/${req.params.uid}:`, error);
    res.status(500).json({ error: 'Failed to terminate employee.' });
  }
});

// =============================================================================
// RESUME ROUTES
// =============================================================================

/**
 * @route   POST /api/db/resume
 * @desc    Adds a new resume for a candidate.
 * @access  Public
 *
 */
router.post('/resume', upload.single('resumeFile'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'Resume file is required.' });
      }

      const { candidateUID, name } = req.body;
      if (!candidateUID || !name) {
        fs.unlinkSync(req.file.path);
        return res
          .status(400)
          .json({ error: 'Candidate UID and resume name are required.' });
      }

      const numericCandidateUID = parseInt(candidateUID, 10);
      const resumeURL = `/resources/resumes/${candidateUID}/${req.file.filename}`;

      const existingResumes = await getCandidateResumes(numericCandidateUID);
      const isPrimary = existingResumes.length === 0;

      const newResume = await addNewCandidateResume(numericCandidateUID, isPrimary, resumeURL, name);

      res.status(201).json(newResume);
    } catch (error) {
      console.error('Error in /add-new-candidate-resume route:', error);
      res.status(500).json({ error: 'Failed to upload and save resume.' });
    }
  }
);

/**
 * @route   Update /api/db/primary-resume/:candidateUID/:resumeId
 * @desc    Updates the primary resume by its ID.
 * @access  Public
 */
router.put('/primary-resume/:candidateUID/:resumeId', async (req, res) => {
    try {
      const resumeId = parseInt(req.params.resumeId, 10);
      const candidateUID = parseInt(req.params.candidateUID, 10);
      const updatedResume = await updatePrimaryResume(candidateUID, resumeId);
      res.status(200).json(updatedResume);
    } catch (error) {
      console.error('Error in /update-primary-resume route:', error);
      res.status(500).json({ error: 'Failed to update primary resume.' });
    }
  }
);

/**
 * @route Update /api/db/resume-name/:resumeId
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
 * @route   DELETE /api/db/resume/:resumeId
 * @desc    Deletes a resume by its ID and its associated file.
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
    // (Assuming the property is `resumeURL` as used in your path creation)
    if (deletedResume.resumeURL) {
        const serverRootPath = path.join(__dirname, '..', '..');
        const filePath = path.join(serverRootPath, deletedResume.resumeURL);
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
      // Success: DB entry deleted, no file to remove. Send response and stop.
      return res.status(200).json({ 
        message: 'Resume deleted successfully. There was no associated file to remove.', 
        deletedResume 
      });
    }

  } catch (error) {
    console.error('Error in /delete-resume route:', error.message);

    // Handle specific errors from the DB function
    if (error.message === 'DELETE_FAILED_ASSOCIATED') {
      return res.status(409).json({ 
        error: 'This resume cannot be deleted because it is associated with a job application.' 
      });
    }

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
 * @route   GET /api/db/courses
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
 * @route   GET /api/db/comments
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

router.post("/create-course", async (req, res) => {
  try {
    const courseData = req.body;
    const newCourse = await createCourse(courseData);
    res.status(201).json(newCourse);
  } catch (error) {
    console.error("Error in /create-course route:", error);
    res.status(500).json({ error: "Failed to create course." });
  }
});

// =============================================================================
// TIMECARD ROUTES
// =============================================================================

/**
 * @route   GET /api/db/timecard/:jobPositionHistoryId
 * @desc    Retrieves the current weekly timecard for a specific job.
 * @access  Public
 * @param   {string} jobPositionHistoryId - The ID of the job history record.
 */
router.get("/timecard/:jobPositionHistoryId", async (req, res) => {
    try {
      const jobPositionHistoryId = parseInt(req.params.jobPositionHistoryId, 10);
      if (isNaN(jobPositionHistoryId)) {
        return res.status(400).json({ error: "Invalid Job Position History ID." });
      }
      const timecard = await getEmployeeTimecard(jobPositionHistoryId);
      if (!timecard) {
        return res.status(404).json({ message: "No timecard found for the current week." });
      }
      res.status(200).json(timecard);
    } catch (error) {
      console.error(`Error in /timecard/${req.params.jobPositionHistoryId} route:`, error);
      const errorMessage = process.env.NODE_ENV === 'development' 
        ? error.message 
        : "An error occurred while retrieving the timecard.";
      res.status(500).json({ error: errorMessage });
    }
});

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
 * @route   GET /timecard/most-recent/:jobPositionHistoryId
 * @desc    Retrieves the most recent weekly timecard for the specified job position history ID.
 * @access  Public
 * @param   {string} jobPositionHistoryId - The ID of the employee's job position history.
 */
router.get('/timecard/most-recent/:jobPositionHistoryId', async (req, res) => {
  const { jobPositionHistoryId } = req.params;

  try {
    const data = await getMostRecentTimecard(Number(jobPositionHistoryId));
    res.json(data);
  } catch (error) {
    console.error('Error in /timecard/most-recent:', error);
    res.status(500).json({ message: 'Failed to retrieve most recent timecard.' });
  }
});

router.post('/timecard/day/notes', async (req, res) => {
    try {
        const { jobPositionHistoryId, date, notes } = req.body;
        if (!jobPositionHistoryId || !date) {
            return res.status(400).json({ error: "Missing required data for saving notes." });
        }
        const result = await upsertTimecardDay({ jobPositionHistoryId, date, notes });
        res.status(200).json(result);
    } catch (error) {
        console.error('Failed to save notes:', error);
        res.status(500).json({ message: 'Failed to save notes.' });
    }
});

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

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = router;

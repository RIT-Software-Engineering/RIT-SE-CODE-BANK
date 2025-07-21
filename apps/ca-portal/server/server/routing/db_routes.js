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
  getOpenPositionsWithDetails,
  getAllUsers,
  getAllCourses,
  createCourse,
  findUniqueUser,
  upsertCandidateProfile,
  upsertEmployerProfile,
  searchAndFilterOpenJobPositions,
  applyForJobPosition,
  addNewCandidateResume,
  updatePrimaryResume,
  resetResumesToNonPrimary,
  deleteResume,
  getCandidateApplications,
  modifyPosition,
  getCandidateApplicationsForFaculty,
  deleteCandidateApplication,
  createPosition
} = require('../database/query_db');

// =============================================================================
// MIDDLEWARE & FILE STORAGE CONFIGURATION
// =============================================================================

// Define the absolute path for storing resumes.
const resumeStoragePath = path.resolve(__dirname, "../../resources/resumes");

// Ensure the base directory for resumes exists, creating it if necessary.
fs.mkdirSync(resumeStoragePath, { recursive: true });

// Configure multer's disk storage engine.
const storage = multer.diskStorage({
  /**
   * Sets the destination folder for the uploaded file.
   * Creates a user-specific subfolder using their UID to organize resumes.
   */
  destination: function (req, file, cb) {
    const userFolderPath = path.join(resumeStoragePath, req.body.candidateUID);
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
  },
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
 * @desc    Retrieves all job positions currently marked as "OPEN".
 * @access  Public
 */
router.get("/open-positions", async (req, res) => {
  try {
    const positions = await getOpenPositionsWithDetails();
    res.status(200).json(positions);
  } catch (error) {
    console.error("Error in /open-positions route:", error);
    res.status(500).json({ error: "Failed to retrieve open positions." });
  }
});

/**
 * @route   GET /api/db/search-and-filter-open-positions
 * @desc    Searches and filters open job positions based on query parameters.
 * @access  Public
 * @query   {string} [searchTerm] - Text to search in course names/codes.
 * @query   {string} [filters] - A JSON string of filter criteria.
 * @query   {string} [candidateUID] - The UID of the candidate for eligibility checks.
 */
router.get("/search-and-filter-open-positions", async (req, res) => {
  const { searchTerm, filters: filtersString, candidateUID } = req.query;
  try {
    const filters = filtersString ? JSON.parse(filtersString) : {};
    const numericCandidateUID = parseInt(candidateUID, 10);
    if (isNaN(numericCandidateUID)) {
      return res
        .status(400)
        .json({ error: "Candidate UID must be a valid number." });
    }
    const positions = await searchAndFilterOpenJobPositions(searchTerm, filters, numericCandidateUID);
    res.status(200).json(positions);
  } catch (error) {
    console.error("Error in /search-and-filter-open-positions route:", error);
    res
      .status(500)
      .json({ error: "Failed to search or filter open positions." });
  }
});

/**
 * @route   POST /api/db/apply-for-job-position
 * @desc    Creates a new job application record for a candidate using an existing resume.
 * @access  Public
 * @body    {object} jobPositionApplicationData - The application details.
 */
router.post("/apply-for-job-position", async (req, res) => {
  try {
    const applicationDetails = req.body;

    // Validate that the required resumeId is present.
    if (!applicationDetails.resumeId) {
      return res.status(400).json({ error: 'A resumeId is required to apply with an existing resume.' });
    }

    const application = await applyForJobPosition(applicationDetails);
    res.status(201).json(application);
  } catch (error) {
    console.error("Error in /apply-for-job-position route:", error);
    res.status(500).json({ error: "Failed to apply for job position." });
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

    const position = await createPosition(positionData,positionData.facultyUID);
    console.log("Route call with faculty: ", positionData.facultyUID);
    res.status(201).json(position);
  } catch (error) {
    console.error("Error in /create-position route:", error);
    res.status(500).json({ error: "Failed to create position." });
  }
})

/**
 * @route   POST /api/db/apply-for-job-position-with-new-resume
 * @desc    Handles a job application that includes a new resume upload.
 * @access  Public
 * @body    {File} resumeFile - The PDF resume file.
 * @body    {string} candidateUID - The UID of the applicant.
 * @body    {string} jobPositionId - The ID of the job position.
 * @body    {string} jobPositionApplicationFormData - JSON string of the form data.
 */
router.post(
  "/apply-for-job-position-with-new-resume",
  upload.single("resumeFile"),
  async (req, res) => {
    try {
      // Ensure a file was actually uploaded.
      if (!req.file) {
        return res.status(400).json({ error: "Resume file is required." });
      }

      const { candidateUID, jobPositionId, jobPositionApplicationFormData } =
        req.body;
      const numericCandidateUID = parseInt(candidateUID, 10);
      // Check if the candidateUID is a valid number.
      if (isNaN(numericCandidateUID)) {
        return res
          .status(400)
          .json({ error: "Candidate UID must be a valid number." });
      }

      // 1. Find the candidate to get their old resume URL for later deletion.
      const candidate = await findUniqueUser(numericCandidateUID);
      const oldResumeUrl = candidate?.candidate?.resumeURL;

      // 2. Construct the public-facing URL for the newly uploaded resume.
      const newResumeUrl = `/resources/resumes/${candidateUID}/${req.file.filename}`;

      // 3. Update the candidate's record in the database with the new resume URL.
      await updateUserResumeUrl(numericCandidateUID, newResumeUrl);

      // 4. If an old resume existed, delete it from the file system to save space.
      if (oldResumeUrl) {
        const oldFilePath = path.join(__dirname, "../../", oldResumeUrl);
        try {
          fs.unlinkSync(oldFilePath);
          console.log(`Successfully deleted old resume: ${oldFilePath}`);
        } catch (unlinkErr) {
          console.error(
            `Failed to delete old resume file, it may not exist: ${oldFilePath}`,
            unlinkErr.message
          );
        }
      }

      // 5. Proceed with creating the application record, ensuring the new resume URL is included.
      const parsedFormData = JSON.parse(jobPositionApplicationFormData);
      parsedFormData.resumeURL = newResumeUrl;

      const applicationDetails = {
        candidateUID: numericCandidateUID,
        jobPositionId: jobPositionId,
        jobPositionApplicationFormData: JSON.stringify(parsedFormData),
      };

      const application = await applyForJobPosition(applicationDetails);

      // Respond with 201 Created status.
      res.status(201).json(application);
    } catch (error) {
      console.error(
        "Error in /apply-for-job-position-with-new-resume route:",
        error
      );
      res
        .status(500)
        .json({ error: "Failed to process application with resume." });
    }});
  
/**
 * @route   GET /api/db/applications/:UID
 * @desc    Retrieves all applications for a specific candidate/employee.
 * @access  Public
 * @param   {string} UID - The UID of the candidate/employee.
 */ 
router.get("/applications/:UID", async (req, res) => {
    try {
    const numericUID = parseInt(req.params.UID, 10);
      if (isNaN(numericUID)) {
        return res.status(400).json({ error: "UID must be a valid number." });
      }
      const applications = await getCandidateApplications(numericUID);
      res.status(200).json(applications);
    } catch (error) {
      console.error(`Error in /applications/${req.params.UID} route:`, error.message);
      res.status(500).json({ error: "An error occurred while retrieving applications." });
    }
});

/**
 * @route   DELETE /api/db/applications/:uid
 * @desc    Deletes a job application record for a candidate.
 * @access  Public
 * @param   {string} uid - The UID of the candidate.
 */
router.delete("/applications/:uid", async (req, res) => {
  try {
    const candidateUID = parseInt(req.params.uid, 10);
    if (isNaN(candidateUID)) {
      return res.status(400).json({ message: "A valid numeric candidate UID is required." });
    }

    const { jobPositionId } = req.query;
    if (!jobPositionId) {
      return res.status(400).json({ message: "The jobPositionId query parameter is required." });
    }

    const deletedApplication = await deleteCandidateApplication(candidateUID, jobPositionId);
    res.status(200).json(deletedApplication);

  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2025') {
      return res.status(404).json({ message: "Application not found." });
    }
    console.error('API Error deleting application:', error);
    res.status(500).json({ message: "An error occurred while deleting the application." });
  }
});

/**
 * @route   GET /api/db/applications/employer/:employerUid
 * @desc    Retrieves all applications for job positions managed by a specific employer.
 * @access  Public
 * @param   {string} employerUid - The UID of the employer.
 */
router.get("/applications/employer/:employerUid", async (req, res) => {
    try {
      const employerUid = parseInt(req.params.employerUid, 10);
      if (isNaN(employerUid)) {
        return res.status(400).json({ error: "Employer UID must be a valid number." });
      }
      const positions = await getCandidateApplicationsForFaculty(employerUid);
      res.status(200).json(positions);
    } catch (error) {
      console.error(`Error in /applications/${req.params.employerUid} route:`, error.message);
      res.status(500).json({ error: "An error occurred while retrieving applications." });
    }
});

// =============================================================================
// USER & PROFILE ROUTES
// =============================================================================

/**
 * @route   GET /api/db/users
 * @desc    Retrieves a list of all users.
 * @access  Public
 */
router.get("/users", async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error("Error in /users route:", error);
    res.status(500).json({ error: "Failed to retrieve users." });
  }
});

/**
 * @route   GET /api/db/users/:UID
 * @desc    Retrieves a single user's profile by their UID.
 * @access  Public
 * @param   {string} UID - The user's unique identifier.
 */
router.get("/users/:UID", async (req, res) => {
  const { UID } = req.params;
  try {
    const numericUID = parseInt(UID, 10);
    if (isNaN(numericUID)) {
      return res
        .status(400)
        .json({ error: "User UID must be a valid number." });
    }
    const user = await findUniqueUser(numericUID);
    res.status(200).json(user);
  } catch (error) {
    console.error(`Error in /users/${UID} route:`, error);
    res.status(500).json({ error: "Failed to retrieve user." });
  }
});

/**
 * @route   POST /api/db/upsert-candidate-profile
 * @desc    Creates or updates a candidate's profile.
 * @access  Public
 * @body    {object} candidateData - The full profile data for the candidate.
 */
router.post("/upsert-candidate-profile", async (req, res) => {
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

// =============================================================================
// GENERAL & UTILITY ROUTES
// =============================================================================

/**
 * @route   GET /api/db/courses
 * @desc    Retrieves a list of all available courses.
 * @access  Public
 */
router.get("/courses", async (req, res) => {
  try {
    const courses = await getAllCourses();
    res.status(200).json(courses);
  } catch (error) {
    console.error("Error in /courses route:", error);
    res.status(500).json({ error: "Failed to retrieve courses." });
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
// EXPORTS
// =============================================================================

module.exports = router;

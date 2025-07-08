// server/server/routing/db_routes.js

const router = require('express').Router();
const path = require('path');
const fs = require('fs');
const multer = require('multer');

// Import the specific query function from query_db.js
const { getOpenPositionsWithDetails, getAllUsers, getAllCourses, findUniqueUser, upsertCandidateProfile, searchAndFilterOpenJobPositions, applyForJobPosition, upsertEmployerProfile, updateUserResumeUrl } = require('../database/query_db');

/* Resume storage path config */
const resumeStoragePath = path.resolve(__dirname, '../../resources/resumes');

fs.mkdirSync(resumeStoragePath, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const userFolderPath = path.join(resumeStoragePath, req.body.candidateUID);
    fs.mkdirSync(userFolderPath, { recursive: true });
    cb(null, userFolderPath);
  },
  filename: function (req, file, cb) {
    const uniquePrefix = Date.now();
    cb(null, `${uniquePrefix}-${file.originalname}`);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only .pdf files are allowed!'), false);
    }
  }
});

/**
 * Route to get all open positions with their associated course and course schedule info.
 * GET /api/db/open-positions
 */
router.get('/open-positions', async (req, res) => {
  try {
    const positions = await getOpenPositionsWithDetails();
    res.status(200).json(positions);
  } catch (error) {
    console.error('Error in /open-positions route:', error);
    res.status(500).json({ error: 'Failed to retrieve open positions.' });
  }
});

router.get('/search-and-filter-open-positions', async (req, res) => {
  const { searchTerm, filters: filtersString, candidateUID } = req.query;

  try {
    const filters = filtersString ? JSON.parse(filtersString) : {};

    const positions = await searchAndFilterOpenJobPositions(
      searchTerm,
      filters,
      parseInt(candidateUID, 10)
    );
    res.status(200).json(positions);
  } catch (error) {
    console.error('Error in /search-open-positions route:', error);
    res.status(500).json({ error: 'Failed to search open positions.' });
  }
});

router.get('/users', async (req, res) => {
  try {
    const users = await getAllUsers();
    res.status(200).json(users);
  } catch (error) {
    console.error('Error in /users route:', error);
    res.status(500).json({ error: 'Failed to retrieve users.' });
  }
});

router.get('/courses', async (req, res) => {
  try {
    const courses = await getAllCourses();
    res.status(200).json(courses);
  } catch (error) {
    console.error('Error in /courses route:', error);
    res.status(500).json({ error: 'Failed to retrieve courses.' });
  }
});

router.get('/users/:UID', async (req, res) => {
  const UID = req.params.UID;
  try {
    const user = await findUniqueUser(UID);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in /users/:UID route:', error);
    res.status(500).json({ error: 'Failed to retrieve user.' });
  }
});

router.post('/upsert-candidate-profile', async (req, res) => {
  const candidateData = req.body;
  try {
    const profile = await upsertCandidateProfile(candidateData);
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error in /upsert-candidate-profile route:', error);
    res.status(500).json({ error: 'Failed to upsert candidate profile.' });
  }
});

router.post('/upsert-employer-profile', async (req, res) => {
  const employerData = req.body;
  try {
    const profile = await upsertEmployerProfile(employerData);
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error in /upsert-employer-profile route:', error);
    res.status(500).json({ error: 'Failed to upsert employer profile.' });
  }
});

router.post('/apply-for-job-position', async (req, res) => {
  const jobPositionApplicationData = req.body;
  try {
    const application = await applyForJobPosition(jobPositionApplicationData);
    res.status(201).json(application);
  } catch (error) {
    console.error('Error in /apply-for-job-position route:', error);
    res.status(500).json({ error: 'Failed to apply for job position.' });
  }
});


router.post('/apply-for-job-position-with-new-resume', upload.single('resumeFile'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Resume file is required.' });
    }

    const { candidateUID, jobPositionId, jobPositionApplicationFormData } = req.body;
    const numericCandidateUID = parseInt(candidateUID, 10);

    // 1. First, find the candidate to get their old resume URL.
    const candidate = await findUniqueUser(candidateUID);
    const oldResumeUrl = candidate?.resumeURL;

    // 2. Construct the NEW resume URL.
    const newResumeUrl = `/resources/resumes/${candidateUID}/${req.file.filename}`;
    
    // 3. Update the candidate's record in the database with the NEW URL.
    await updateUserResumeUrl(numericCandidateUID, newResumeUrl);

    // 4. If an old resume existed, delete it from the file system.
    if (oldResumeUrl) {
      // Construct the full file system path to the old file
      const oldFilePath = path.join(__dirname, '../../', oldResumeUrl);
      try {
        fs.unlinkSync(oldFilePath); // Delete the file
        console.log(`Successfully deleted old resume: ${oldFilePath}`);
      } catch (unlinkErr) {
        // Log an error if the file couldn't be deleted, but don't stop the process.
        // It might not exist, which is fine.
        console.error(`Failed to delete old resume file, it may not exist: ${oldFilePath}`, unlinkErr.message);
      }
    }

    // 5. Proceed with creating the application record using the new data.
    const parsedFormData = JSON.parse(jobPositionApplicationFormData);
    parsedFormData.resumeURL = newResumeUrl; // Ensure the new URL is in the application data
    
    const applicationDetails = {
      candidateUID: numericCandidateUID,
      jobPositionId: jobPositionId,
      jobPositionApplicationFormData: JSON.stringify(parsedFormData),
    };

    const application = await applyForJobPosition(applicationDetails);
    
    res.status(201).json(application);

  } catch (error) {
    console.error('Error in /apply-with-resume route:', error);
    res.status(500).json({ error: 'Failed to process application with resume.' });
  }
});




module.exports = router;
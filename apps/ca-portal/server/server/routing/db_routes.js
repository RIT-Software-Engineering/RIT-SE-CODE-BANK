// server/server/routing/db_routes.js

const router = require('express').Router();
// Import the specific query function from query_db.js
const { getOpenPositionsWithDetails, getAllUsers, getAllCourses, findUniqueUser, upsertCandidateProfile, searchOpenPositions, applyForJobPosition, upsertEmployerProfile } = require('../database/query_db');

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

router.get('/search-open-positions', async (req, res) => {
  const {term} = req.query;
  try{
    const positions = await searchOpenPositions(term);
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



module.exports = router;
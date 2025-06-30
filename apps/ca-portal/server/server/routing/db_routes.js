// server/server/routing/db_routes.js

const router = require('express').Router();
// Import the specific query function from query_db.js
const { getOpenPositionsWithDetails, getAllUsers, getAllCourses, findUniqueUser, upsertStudentProfile } = require('../database/query_db');

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

router.get('/users/:studentUID', async (req, res) => {
  const studentUID = req.params.studentUID;
  try {
    const user = await findUniqueUser(studentUID);
    res.status(200).json(user);
  } catch (error) {
    console.error('Error in /users/:studentUID route:', error);
    res.status(500).json({ error: 'Failed to retrieve user.' });
  }
});

router.post('/upsert-student-profile', async (req, res) => {
  const studentData = req.body;
  try {
    const profile = await upsertStudentProfile(studentData);
    res.status(200).json(profile);
  } catch (error) {
    console.error('Error in /upsert-student-profile route:', error);
    res.status(500).json({ error: 'Failed to upsert student profile.' });
  }
});


module.exports = router;
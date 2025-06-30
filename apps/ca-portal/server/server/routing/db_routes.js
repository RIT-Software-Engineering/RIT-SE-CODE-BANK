// server/server/routing/db_routes.js

const router = require('express').Router();
// Import the specific query function from query_db.js
const { getOpenPositionsWithDetails, getAllUsers, searchOpenPositions } = require('../database/query_db');

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



module.exports = router;
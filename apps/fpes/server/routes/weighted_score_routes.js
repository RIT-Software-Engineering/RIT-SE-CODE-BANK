const express = require('express');
const router = express.Router();
const { calculateWeightedScore, getWeights, updateWeights, calculateScholarshipScore, getPerClassTeachingBreakdown } = require('../api/weighted_score_api');

router.get('/weights', async (_req, res) => {
  try { res.json(await getWeights()); }
  catch (err) { res.status(500).json({ error: err.message }); }
});

router.put('/weights', async (req, res) => {
  try { res.json(await updateWeights(req.body)); }
  catch (err) { res.status(400).json({ error: err.message }); }
});

router.post('/calculate', async (req, res) => {
  try {
    const weights = await getWeights();
    res.json(calculateWeightedScore(req.body, weights));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

router.get('/scholarship-score/:facultyId', async (req, res) => {
  try {
    res.json(await calculateScholarshipScore(req.params.facultyId, req.query.form_id || null));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.get('/per-class/:facultyId', async (req, res) => {
  try {
    res.json(await getPerClassTeachingBreakdown(req.params.facultyId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;

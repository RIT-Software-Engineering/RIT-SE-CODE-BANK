const express = require('express');
const router = express.Router();
const { calculateWeightedScore, getWeights, updateWeights, calculateScholarshipScore, getPerClassTeachingBreakdown, calculateFinalTier } = require('../api/weighted_score_api');

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

// GET scholarship score for a faculty member
// Query param: ?form_id=... (to check grants on that specific form)
router.get('/scholarship-score/:facultyId', async (req, res) => {
  try {
    const result = await calculateScholarshipScore(req.params.facultyId, req.query.form_id || null);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// GET per-class teaching breakdown for a faculty member
router.get('/per-class/:facultyId', async (req, res) => {
  try {
    res.json(await getPerClassTeachingBreakdown(req.params.facultyId));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// POST calculate final tier from a score against all faculty scores
// Body: { finalScore, allScores: [] }
router.post('/tier', async (req, res) => {
  try {
    const { finalScore, allScores } = req.body;
    res.json(calculateFinalTier(finalScore, allScores));
  } catch (err) { res.status(400).json({ error: err.message }); }
});

module.exports = router;

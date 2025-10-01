const router = require('express').Router();
const { changeCandidateApplicationStatus } = require('../database/query_db');

router.post('/notify-status', async (req, res) => {
      console.log('🔥 Hit /api/dev/notify-status with body:', req.body);

  const { applicationId, status } = req.body || {};
  try {
    const result = await changeCandidateApplicationStatus('System', applicationId, status, 'Dev test');
    res.json({ ok: true, result });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

module.exports = router;
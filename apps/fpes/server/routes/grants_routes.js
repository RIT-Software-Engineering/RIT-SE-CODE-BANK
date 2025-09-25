
const express = require('express');
const router = express.Router();
const grantsApi = require('../api/grants_api');



router.get('/', async (req, res) => {
  try {
    const rows = await grantsApi.getAllGrants();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({err});
  }
});

router.get('/:id', async (req, res) => {
  try {
    const grant = await grantsApi.getGrantById(req.params.id);
    if (!grant) return res.status(404).json({ error: "Grant not found" });
    res.json(grant);
  } catch (err) {
    console.error(err);
    res.status(500).json({err});
  }
});

router.get('/:form_id', async (req, res) => {
  try {
    const grant = await grantsApi.getGrantByFormId(req.params.fomrm_id);
    if (!grant) return res.status(404).json({ error: "Grant not found" });
    res.json(grant);
  } catch (err) {
    console.error(err);
    res.status(500).json({err});
  }
});

router.post('/', async (req, res) => {
  let conn;
  try {
    const result = await grantsApi.addGrant(req.body);
    res.json({ grant_id: result.insertId, message: "Grant added" });
  } catch (err) {
    console.error(err);
    res.status(500).send(err);
  } finally {
    if (conn) conn.release();
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await grantsApi.deleteGrant(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Grant not found" });
    res.json({ message: "Grant deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({err});
  }
});

module.exports = router;

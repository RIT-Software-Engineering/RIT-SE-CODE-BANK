
const express = require('express');
const router = express.Router();



router.get('/', async (req, res) => {
  try {
    const rows = await grantsApi.getAllGrants();
    res.json(rows);
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

module.exports = router;

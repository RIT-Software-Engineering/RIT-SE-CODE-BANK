const express = require('express');
const router = express.Router();
const studentSupportApi = require('../api/student_support_api');

router.get('/', async (req, res) => {
  try {
    const rows = await studentSupportApi.getAllStudentSupport();
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({err});
  }
});


router.get('/:id', async (req, res) => {
  try {
    const record = await studentSupportApi.getStudentSupportById(req.params.id);
    if (!record) return res.status(404).json({ error: "Record not found" });
    res.json(record);
  } catch (err) {
    console.error(err);
    res.status(500).json({err});
  }
});

router.post('/', async (req, res) => {
  try {
    const result = await studentSupportApi.addStudentSupport(req.body);
    res.status(201).json({ id: result.id, message: "Record added" });
  } catch (err) {
    console.error(err);
    res.status(500).json({err});
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await studentSupportApi.updateStudentSupport(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: "Record not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err});
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const deleted = await studentSupportApi.deleteStudentSupport(req.params.id);
    if (!deleted) return res.status(404).json({ error: "Record not found" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ err});
  }
});


module.exports = router;
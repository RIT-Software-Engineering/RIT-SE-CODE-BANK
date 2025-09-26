const express = require('express');
const router = express.Router();
const studentSupportApi = require('../api/student_support_api');

router.get('/', async (req, res) => {
  try {
    const rows = await api.getAllStudentSupport(req.params.id);
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({err});
  }
});
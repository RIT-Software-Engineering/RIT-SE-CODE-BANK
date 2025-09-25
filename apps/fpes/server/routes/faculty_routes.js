const express = require('express');
const router = express.Router();
const faculty = require('../api/faculty_api');
const pool = require('../db')

// GET /faculty
router.get('/', async (req, res) => {
  try {
    const rows = await faculty.getAllFaculty();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// GET /faculty/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await faculty.getFacultyById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch faculty' });
  }
});

// POST /faculty
router.post('/', async (req, res) => {
  try {
    const { name, rank, unit, affiliations } = req.body || {};
    if (!name || !rank || !unit) {
      return res.status(400).json({ error: 'name, rank, and unit are required' });
    }
    const result = await faculty.addFaculty({ name, rank, unit, affiliations });
    res.status(201).json(result); // { faculty_id: ... }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add faculty' });
  }
});

// PUT /faculty/:id  (partial update is fine)
router.put('/:id', async (req, res) => {
  try {
    const result = await faculty.updateFaculty(req.params.id, req.body || {});
    res.json(result); // { changedRows: n }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update faculty' });
  }
});

// DELETE /faculty/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await faculty.deleteFaculty(req.params.id);
    res.json(result); // { deleted: true/false }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete faculty' });
  }
});

module.exports = router;

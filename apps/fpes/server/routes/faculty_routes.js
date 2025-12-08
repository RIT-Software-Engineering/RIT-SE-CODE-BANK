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

router.get('/supervisors', async (req,res) => {
  try {
    const rows = await faculty.getAllSupervisors();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch supervisors' });
  }
});

// GET /faculty/:id/supervisor : gets a faculty member's supervisor
router.get('/:id/supervisor', async (req, res) => {
  try {
    const row = await faculty.getSupervisorOfFacultyMember(req.params.id);
    if(!row) return res.status(404).json({ error: 'Faculty Member does not have an assigned supervisor'});
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({error: "Failed to fetch faculty member's supervisor"})
  }
});

// GET /faculty/supervised_by/:id : gets all faculty supervised by a given faculty member
router.get('/supervised_by/:id', async (req,res) => {
  try {
    const row = await faculty.getAllFacultyOfSupervisor(req.params.id);
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({error: "Failed to fetch faculty of supervisor"})
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

// GET 

// POST /faculty
router.post('/', async (req, res) => {
  try {
    const { name, rank, unit, affiliations, user_role } = req.body || {};
    if (!name || !rank || !unit || !user_role) {
      return res.status(400).json({ error: 'name, rank, unit and user_role are required' });
    }
    const result = await faculty.addFaculty({ name, rank, unit, affiliations, user_role });
    res.status(201).json(result); // { faculty_id: ... }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add faculty' });
  }
});

// PUT /faculty/:faculty_id/assign_supervisor/:supervisor_id : Assign a faculty member a supervisor
router.put('/:faculty_id/assign_supervisor/:supervisor_id', async (req,res) => {
  try {
    const result = await faculty.assignSupervisorToFaculty(req.params.faculty_id, req.params.supervisor_id);
    res.json(result);
  } catch {
    console.error(e);
    res.status(500).json({ error: 'Failed to assign supervisor to faculty member'})
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

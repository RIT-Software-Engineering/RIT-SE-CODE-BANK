const express = require('express');
const router = express.Router();
const courses = require('../api/courses_api');

// GET /courses
router.get('/', async (req, res) => {
  try {
    const rows = await courses.getAllCourses();
    res.json(rows);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch courses' });
  }
});

// GET /courses/:id
router.get('/:id', async (req, res) => {
  try {
    const row = await courses.getCourseById(req.params.id);
    if (!row) return res.status(404).json({ error: 'Not found' });
    res.json(row);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to fetch course' });
  }
});

// POST /courses
// body: { course_code, course_name, credits, department_id }
router.post('/', async (req, res) => {
  try {
    const { course_code, course_name, credits, department_id } = req.body || {};
    if (!course_code || !course_name || credits == null || !department_id) {
      return res.status(400).json({
        error: 'course_code, course_name, credits, department_id are required',
      });
    }
    const result = await courses.addCourse({ course_code, course_name, credits, department_id });
    res.status(201).json(result); // { id: ... }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to add course' });
  }
});

// PUT /courses/:id  (partial update)
router.put('/:id', async (req, res) => {
  try {
    const result = await courses.updateCourse(req.params.id, req.body || {});
    res.json(result); // { changedRows: n }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// DELETE /courses/:id
router.delete('/:id', async (req, res) => {
  try {
    const result = await courses.deleteCourse(req.params.id);
    res.json(result); // { deleted: true/false }
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

module.exports = router;

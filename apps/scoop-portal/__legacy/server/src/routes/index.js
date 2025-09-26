const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Test endpoints to verify database setup
router.get('/test/users', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT system_id, fname, lname, role, user_type 
            FROM users
        `);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

router.get('/test/teams', async (req, res) => {
    try {
        const result = await db.query(`
            SELECT 
                p.title as project_title,
                t.name as team_name,
                json_agg(json_build_object(
                    'name', u.fname || ' ' || u.lname,
                    'role', u.role
                )) as team_members
            FROM projects p
            JOIN teams t ON t.project_id = p.project_id
            JOIN team_students ts ON ts.team_id = t.team_id
            JOIN users u ON u.system_id = ts.student_id
            GROUP BY p.title, t.name
        `);
        res.json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router; 
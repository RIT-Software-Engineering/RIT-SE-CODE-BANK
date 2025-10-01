const express = require('express');
const api = require('../api/departments_api');
const router = express.Router();

// Gets department of a specified id
router.get("/:id", async (req,res) => {
    try {
        const results = await api.getDepartmentByID(req.params.id);
        console.log(results)
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Gets all departments
router.get("/", async (req,res) => {
    try {
        const results = await api.getAllDepartments();
        console.log(results)
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Creates a new department
router.post("/", async (req,res) =>{
    try {
            const results = await api.createDepartment(req.body);
            console.log({affectedRows : results.affectedRows, insertedId : results.insertId});
            res.json({affectedRows : results.affectedRows});
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
});

// Updates an existing department
router.put("/", async (req,res) => {
    try {
        const results = await api.updateDepartment(req.body);
        console.log({affectedRows : results.affectedRows, insertedId : results.insertId});
        res.json({affectedRows : results.affectedRows});
    } catch {
        console.log(err);
        res.status(500).send(err);
    }
});

// Deletes a department by a given id
router.delete("/:id", async (req,res) => {
    try {
        const results = await api.deleteDepartment(req.params.id);
        console.log({affectedRows : results.affectedRows});
        res.json({affectedRows : results.affectedRows});
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

module.exports = router;
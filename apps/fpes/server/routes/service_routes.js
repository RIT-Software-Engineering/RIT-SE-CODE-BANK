const express = require('express');
const router = express.Router();
const api = require('../api/service_api');
router.use(express.json()); 

// Gets service by its primary key
router.get("/:id", async (req,res) => {
    try {
        const results = await api.getServiceById(req.params.id);
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});
// Deletes a service given its primary key
router.delete("/:id", async (req,res) => {
    try {
        const results = await api.deleteService(req.params.id);
        console.log({affectedRows : results.affectedRows});
        res.json({affectedRows : results.affectedRows});
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Gets all services of a given form_id
router.get("/of-form/:form_id", async (req,res) => {
    try {
        const results = await api.getServicesByFormId(req.params.form_id);
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Resets table with test data
router.post("/init", async (req,res) => {
    try {
        console.log("Table Reset")
        const results = await api.resetServiceTable();
        console.log(results)
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Gets all services
router.get("/", async (req,res) => {
    try {
        const results = await api.getAllServices();
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Creates a new service
router.post("/", async (req,res) => {
    try {
        const results = await api.createService(req.body);
        console.log({affectedRows : results.affectedRows, insertedId : results.insertId});
        res.json({affectedRows : results.affectedRows});
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Updates an existing service
router.put("/", async (req,res) => {
    try {
        const results = await api.updateService(req.body);
        console.log({affectedRows : results.affectedRows, insertedId : results.insertId});
        res.json({affectedRows : results.affectedRows});
    } catch {
        console.log(err);
        res.status(500).send(err);
    }
});

module.exports = router;
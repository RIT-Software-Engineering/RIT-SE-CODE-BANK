const express = require('express');
const router = express.Router();
const api = require('../api/service_api');

// Resets table with test data
router.delete("/reset", async (req,res) => {
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

router.post("/", async (req,res) => {
    try {
        const results = await api.createService(await req.body);
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});



module.exports = router;
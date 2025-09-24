const express = require('express');
const router = express.Router();
const api = require('../api/service_api');
const pool = require('../db')

router.get("/reset", async (req,res) => {
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



module.exports = router;
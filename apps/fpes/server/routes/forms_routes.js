const { getFormsBySupervisorId, getFormByIdInViewFormat, getAllForms } = require('../api/forms_api');
const pool = require('../db');
const express = require('express');
const router = express.Router();



// GET /forms/supervisor/:supervisor_id:  
router.get("/supervisor/:supervisor_id", async (req,res) => {
    try{
        const response = await getFormsBySupervisorId(req.params.supervisor_id);
        res.send(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({error : "Error while attempting to retrieve forms"})
    }
});

// GET /forms/:form_id/preview_format
router.get("/:form_id/view_format", async (req,res) => {
    try {
        const response = await getFormByIdInViewFormat(req.params.form_id);
        res.send(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error : "Error while attempting to retrieve form"})
    }
});

// GET /forms
router.get("/", async (req, res) => {
    try {
        const response = await getAllForms();
        res.send(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error : "Error while attempting to retrieve forms"})
    }
});

module.exports = router;
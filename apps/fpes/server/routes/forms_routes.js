const { getFormsBySupervisorId } = require('../api/forms_api');
const pool = require('../db');
const express = require('express');
const router = express.Router();

// GET /forms/supervisor/:id:  
router.get("/supervisor/:id", async (req,res) => {
    try{
        const response = await getFormsBySupervisorId(req.params.id);
        res.send(response);
    } catch (err) {
        console.error(err);
        res.status(500).json({error : "Error while attempting to retrieve forms"})
    }
});

module.exports = router;
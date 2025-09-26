const express = require('express');
const router = express.Router();
const api = require('../api/course_section_api');
router.use(express.json()); 

router.get("/", async (req,res) => {
    
});
const express = require('express');
const router = express.Router();
const api = require('../api/course_section_api');
router.use(express.json()); 

router.get("/", async (req,res) => {
    try {
        const results = await api.getAllCourseSections();
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

module.exports = router;
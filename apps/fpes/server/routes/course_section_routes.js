const express = require('express');
const router = express.Router();
const api = require('../api/course_section_api');
router.use(express.json()); 

router.get("/of-course/:course_id", async (req,res) => {
    try {
        const results = await api.getSectionsByCourseID(req.params.course_id)
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
})

router.post("/init", async (req,res) =>{
    try {
        const results = await api.initCourseSectionsTable();
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
})

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
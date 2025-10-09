const express = require('express');
const router = express.Router();
const api = require('../api/course_section_api');
router.use(express.json()); 

router.get("/year/:year_id/semester/:semester", async (req,res) => {
    try {
        const results = await api.getSectionBySemesterAndYear(req.params.year_id, req.params.semester)
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

router.get("/year/:year_id", async (req,res) => {
    try {
        const results = await api.getSectionByYear(req.params.year_id)
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

router.get("/:id", async (req,res) => {
    try {
        const results = await api.getSectionByID(req.params.id)
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
})

router.put("/:id", async (req,res) => {
    try {
        const results = await api.updateCourseSection(req.params.id, req.body);
        console.log({affectedRows : results.affectedRows}); //insertId logged
        res.json({affectedRows : results.affectedRows});
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

router.delete("/:id", async (req,res) => {
    try {
        const results = await api.removeCourseSectionByID(req.params.id);
        console.log({affectedRows : results.affectedRows});
        res.json({affectedRows : results.affectedRows});
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

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

router.post("/", async (req,res) => {
    try {
        const results = await api.createCourseSection(req.body);
        console.log({affectedRows : results.affectedRows, insertedId : results.insertId});
        res.json({affectedRows : results.affectedRows});
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});





module.exports = router;
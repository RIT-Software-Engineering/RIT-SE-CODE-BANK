const express = require('express');
const router = express.Router();
const api = require('../api/publications_api');

// Gets publication of a specified id
router.get("/:id", async (req,res) => {
    try {
        const results = await api.getPublicationByID(req.params.id);
        console.log(results)
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Deletes a publication by a given id
router.delete("/:id", async (req,res) => {
    try {
        const results = await api.deletePublication(req.params.id);
        console.log({affectedRows : results.affectedRows});
        res.json({affectedRows : results.affectedRows});
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});


// Initializes the publication database
router.post("/init", async (req,res) =>{
    try {
        const results = await api.initPublicationsTable();
        console.log(results);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
})

// Gets all publications
router.get("/", async (req,res) => {
    try {
        const results = await api.getAllPublications();
        console.log(results)
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Creates a new publication
router.post("/", async (req,res) =>{
    try {
            const results = await api.createPublication(req.body);
            console.log({affectedRows : results.affectedRows, insertedId : results.insertId});
            res.json({affectedRows : results.affectedRows});
        } catch (err) {
            console.log(err);
            res.status(500).send(err);
        }
});

// Updates an existing publication
router.put("/", async (req,res) => {
    try {
        const results = await api.updatePublication(req.body);
        console.log({affectedRows : results.affectedRows, insertedId : results.insertId});
        res.json({affectedRows : results.affectedRows});
    } catch {
        console.log(err);
        res.status(500).send(err);
    }
});

module.exports = router;


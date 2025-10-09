const express = require('express');
const router = express.Router();
const api = require('../api/publications_api');

// Gets publication of a specified title
router.get("/:title", async (req,res) => {
    try {
        const results = await api.getPublicationByTitle(req.params.title);
        if(results.length === 0){
            console.log("Publication not found")
            res.status(404).send("Publication not found")
        }else{
            console.log(results)
            res.json(results);
        }
        
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});

// Updates an existing publication
router.put("/:title", async (req,res) => {
    try {
        const results = await api.updatePublication(req.params.title, req.body);
        if(results.length === 0){
            res.status(404).send("Publication user attempted to update does not exist")
        }
        console.log({affectedRows : results.affectedRows});
        res.json({affectedRows : results.affectedRows});
    } catch {
        console.log(err);
        res.status(500).send(err);
    }
});

// Deletes a publication by a given title
router.delete("/:title", async (req,res) => {
    try {
        const results = await api.deletePublication(req.params.title);
        if(results.length === 0){
            console.log("Publication not found")
            res.status(404).send("Publication not found")
        }else{
            console.log({affectedRows : results.affectedRows});
            res.json({affectedRows : results.affectedRows});
        }
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    }
});


// Initializes the publication database
router.post("/init", async (req,res) =>{
    try {
        const results = await api.initPublicationsTable();
        console.log("Successfully initialized publications table");
        res.send("Successfully initialized publications table");
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



module.exports = router;


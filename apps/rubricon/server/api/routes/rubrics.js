const auth = require("../middleware/auth.js");
const utils = require("../utils"); // Make sure you have a utils.js file with a save function
const crypto = require("crypto");

const express = require('express');
const router = express.Router();

const rubrics = require('../../data/rubrics.json'); // TODO: Decide where this data should actually live. Likely replace this with MariaDB.

// TODO: Change id to id.

/**
 * Get all rubrics
 */
router.get('/', (req, res) => {
    res.send(rubrics); 
})

/**
 * Get a rubric by id
 */
router.get('/:id', (req, res) => {
  const id = req.params.id;
  const rubric = rubrics.find(r => r.id === id);
  
  if (rubric) {
    res.json(rubric);
  } else {
    res.status(404).send('Rubric not found');
  }
});

/**
 * Create a new rubric
 */
router.post('/', express.json(), (req, res) => {
  const newRubric = req.body;
  newRubric.id = crypto.randomUUID();
  rubrics.push(newRubric);
  utils.save(rubrics, './data/rubrics.json')
      .then(() => console.log('Rubrics updated successfully'))
      .catch(err => console.error('Error saving rubrics:', err));
  res.status(201).send(newRubric);
});

/**
 * Update a specific rubric
 */
router.put('/:id', [express.json(), auth.mockUser, auth.authorizeAccessLevel("Creator")], (req, res) => {
  const id = req.params.id;
  const index = rubrics.findIndex(r => r.id === id);
  
  if (index !== -1) {
    rubrics[index] = req.body;
    utils.save(rubrics, './data/rubrics.json')
    .then(() => console.log('Rubrics updated successfully'))
    .catch(err => console.error('Error saving rubrics:', err));
    res.status(200).send(rubrics[index]);
  } else {
    res.status(404).send('Rubric not found');
  }
});

/**
 * Delete a specific rubric
 */
router.delete('/:id', (req, res) => {
  const id = req.params.id;
  const index = rubrics.findIndex(r => r.id === id);
  
  if (index !== -1) {
    rubrics.splice(index, 1);
    utils.save(rubrics, './data/rubrics.json')
      .then(() => console.log('Rubrics updated successfully'))
      .catch(err => console.error('Error saving rubrics:', err));
    res.status(204).send();
  } else {
    res.status(404).send('Rubric not found');
  }
});

module.exports = router;
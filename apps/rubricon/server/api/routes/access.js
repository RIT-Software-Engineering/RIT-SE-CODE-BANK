const express = require('express');
const router = express.Router();

const access = require('../../data/access.json'); // TODO: Decide where this data should actually live. Likely replace this with MariaDB.

// /**
//  * Get all connections
//  */
// router.get('/', (req, res) => {
//     res.send(access); 
// })

/**
 * Get a connection by id
 */
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const connection = access.find(c => c.id === id);

    if (connection) {
        res.json(connection);
    } else {
        res.status(404).send('Connection not found');
    }
})

/**
 * Get all connections that fit the query params. If no query params are specified, then return all connections. 
 */
router.get('/', (req, res) => {
    if (req.query.userId && req.query.rubricId) { // If it has query params
        const userId = req.query.userId;
        const rubricId = req.query.rubricId;

        const connections = access.filter(c => c.userId === userId && c.rubricId === rubricId);

        if (connections) {
            res.json(connections);
        } else {
            res.status(404).send('No connections found');
        }

    } else if (req.query.userId) {
        const userId = req.query.userId;

        const connections = access.filter(c => c.userId === userId);

        if (connections) {
            res.json(connections);
        } else {
            res.status(404).send('No connections found');
        }

    } else if (req.query.rubricId) {
        const rubricId = req.query.rubricId;

        const connections = access.filter(c => c.rubricId === rubricId);

        if (connections) {
            res.json(connections);
        } else {
            res.status(404).send('No connections found');
        }

    } else { // If it doesn't have query params
        if (access) {
            res.json(access);
        } else {
            res.status(404).send("No connections found")
        }
    }
})

module.exports = router;
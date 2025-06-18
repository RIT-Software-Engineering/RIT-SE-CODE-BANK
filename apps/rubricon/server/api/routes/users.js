const express = require('express');
const router = express.Router();

const users = require('../../data/users.json'); // TODO: Decide where this data should actually live. Likely replace this with MariaDB.

/**
 * Get all users
 */
router.get('/', (req, res) => {
    res.send(users);
})

/**
 * Get a user by id
 */
router.get('/:id', (req, res) => {
    const id = req.params.id;
    const user = users.find(u => u.id === id);

    if (user) {
        res.json(user);
    } else {
        res.status(404).send('Users not found');
    }
})

module.exports = router;
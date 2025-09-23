const express = require('express');
const router = express.Router();
const pool = require('../db')

const mariadb = require('mariadb')

router.get("/", async (req,res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query("SELECT * FROM service");
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    } finally {
        if (connection) connection.release();
    }
})

router.get("/:id", async (req,res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = connection.query("SELECT * FROM service WHERE id = ?", [req.params.id]);
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    } finally {
        if (connection) connection.release();
    }
})

module.exports = router;








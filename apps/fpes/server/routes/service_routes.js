const express = require('express');
const router = express.Router();
const api = require('../api/service_api');


router.get("/", async (req,res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        console.log(connection);
        const results = await api.getAllServices(connection);
        console.log(results)
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send(err);
    } finally {
        if (connection) connection.release();
    }
});

router.get("/:id", async (req,res) => {
    let connection;
    try {
        connection = await pool.getConnection();
        const results = await connection.query("SELECT * FROM service WHERE id = ?", [req.params.id]);
        console.log(results)
        res.json(results);
    } catch (err) {
        console.log(err);
        res.status(500).send("Error");
    } finally {
        if (connection) connection.release();
    }
})

module.exports = router;
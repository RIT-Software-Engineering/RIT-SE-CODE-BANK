// server/server/routing/index.js

"use strict";

const router = require("express").Router();

const db_router = require("./db_routes");

router.use("/db", db_router);

module.exports = router;
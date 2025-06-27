// server/server/routing/index.js

"use strict";

const router = require("express").Router();

const db_router = require("./db_routes");
const slack_router = require("./slack_routes");

router.use("/db", db_router);
router.use("/slack", slack_router);

module.exports = router;
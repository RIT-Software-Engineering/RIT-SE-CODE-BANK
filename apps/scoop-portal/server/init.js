/**
 * Main entry point for the SE Senior Project web server
 * @author Tom Amaral <txa2269@rit.edu>
 */

"use strict";
// Leave importing dotenv as the topmost thing
require("dotenv").config({ path: require("path").join(__dirname, ".env") });

/**
 *
 * FOR DEVELOPMENT USE ONLY
 *
 * UNCOMMENT THIS TO RESET DATABASE
 * Note: This uses the old database setup method.
 * For SCOOP Portal, we now use the init_db.js script in the server/database directory.
 * Run 'node server/database/init_db.js' to initialize the database manually.
 */
// const redeployDatabase = require("./db_setup");
// redeployDatabase();

// Initialize SQLite database for SCOOP Portal
const fs = require('fs');
const path = require('path');
const Logger = require('./server/logger');
const initializeDatabase = require('./init_db');

// Initialize the database if in development mode
if (process.env.NODE_ENV === 'development') {
  Logger.log('Checking if database needs to be initialized...');
  initializeDatabase(false)
    .then(() => {
      Logger.log('Database initialization check completed');
    })
    .catch((err) => {
      Logger.error(`Database initialization failed: ${err.message}`);
    });
}

// Imports
const express = require("express");
const cors = require("cors");
const app = express();
const fileupload = require("express-fileupload");
const cookieParser = require("cookie-parser");
// Constants
const port = process.env.PORT;

// Setup CORS policies
// TODO-IMPORTANT: LOOK FOR BEST PRACTICE CORS POLICIES
// Basic setup found here: https://www.positronx.io/express-cors-tutorial/
app.use(function (req, res, next) {
  // res.header("Access-Control-Allow-Origin", "*");
  // res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");

  // Required for SSO authentication
  // TODO: This may no longer be needed because of our cors policy lower down "credentials: true".
  res.header("Access-Control-Allow-Credentials", "true");

  next();
});
app.use(
  cors({
    origin: process.env.BASE_URL || "http://localhost:3000",
    credentials: true,
  })
);

// Set up body parsing and file upload configurations
app.use(express.urlencoded({ extended: true })); // replaces bodyParser.urlencoded since bodyParser is depreciated
app.use(cookieParser());
app.use(express.json());
app.use(
  fileupload({
    safeFileNames: true,
    preserveExtension: 4,
  })
);

// This is down here because saml_routes needs to be initialized after the express.urlencoded() middleware to be able to process Shibboleth logins
const routing = require("./server/routing/index");
// Attach route handlers
app.use("/", routing);
app.listen(port);

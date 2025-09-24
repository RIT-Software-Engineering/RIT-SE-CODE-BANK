/**
 * =============================================================================
 * Main Server Entry Point
 *
 * This file is the primary entry point for the backend server. It is responsible
 * for:
 * 1. Loading environment variables.
 * 2. Initializing the Express application.
 * 3. Configuring middleware (CORS, JSON parsing, static file serving).
 * 4. Setting up HTTPS for secure communication.
 * 5. Conditionally running the database setup script in development mode.
 * 6. Mounting the main API router.
 * 7. Starting the server and listening for incoming requests.
 * =============================================================================
 */

// =============================================================================
// IMPORTS & CONFIGURATION
// =============================================================================

// Load environment variables from the .env file into process.env.
require('dotenv').config();

// Import the Express framework to create and manage the server.
const express = require('express');
// Import Node.js core modules for handling HTTPS, file system, and paths.
const https = require('https');
const fs = require('fs'); 
const path = require('path');
// Import CORS middleware to enable cross-origin requests from the frontend.
const cors = require('cors');

// Import custom modules from the application's codebase.
const apiRoutes = require('./server/routing/index'); // The main API router.

// Initialize the Express application.
const app = express();
// Get the port number from environment variables.
const port = process.env.PORT;

// =============================================================================
// MIDDLEWARE SETUP
// =============================================================================

// Enable Cross-Origin Resource Sharing for all routes, allowing the frontend to communicate with this backend.
app.use(cors());
// Enable the Express JSON middleware to parse incoming request bodies with JSON payloads.
app.use(express.json());
// Serve static files (like resumes) from the 'resources' directory under the '/resources' URL path.
app.use('/resources', express.static(path.resolve(__dirname, 'resources')));

// =============================================================================
// SERVER INITIALIZATION
// =============================================================================

/**
 * @desc    Asynchronously initializes and starts the server. This function
 * wraps the entire startup logic to handle setup tasks before
 * the server begins listening for requests.
 */
// ... all your imports and setup stay the same ...

async function initializeApp() {
  const httpsOptions = {
    key: fs.readFileSync("./localhost+2-key.pem"),
    cert: fs.readFileSync("./localhost+2.pem"),
  };

  if (!port) {
    console.error(
      "FATAL ERROR: PORT is not defined in your .env file. Server cannot start."
    );
    process.exit(1);
  }

  // Root route
  app.get("/", (req, res) => {
    res.send("Welcome to the RIT TA Portal Backend!");
  });

  // Test error route
  app.get("/api/test-error", (req, res, next) => {
    const err = new Error("Deliberate test error");
    err.statusCode = 500;
    next(err); // pass to error handler
  });

  // Mount main API router
  app.use("/api", apiRoutes);

  // ✅ Catch-all 404 handler
  app.use((req, res, next) => {
    const err = new Error(`Not Found: ${req.originalUrl}`);
    err.statusCode = 404;
    next(err);
  });

  // ✅ Custom error handler
  const errorHandler = require("./server/middleware/errorHandler.js");
  app.use(errorHandler);

  // ✅ Only now start the server
  https.createServer(httpsOptions, app).listen(port, () => {
    console.log(`Server listening on ${process.env.BACKEND_URL}`);
    console.log(
      `Current Environment: ${process.env.NODE_ENV || "development"}`
    );
  });
}


// =============================================================================
// START SERVER
// =============================================================================

// Call the initialization function to start the entire server setup process.
initializeApp();
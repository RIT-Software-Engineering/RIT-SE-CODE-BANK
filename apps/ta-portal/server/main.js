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
// Be explicit to ensure PUT preflight (OPTIONS) succeeds with the right headers and methods.
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
  'https://localhost:3000',
];
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl) or allowed origins
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(null, false);
  },
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: false,
  optionsSuccessStatus: 204,
}));
// Enable the Express JSON middleware to parse incoming request bodies with JSON payloads.
// Add a JSON parse error handler so malformed JSON returns 400 instead of a crash.
const jsonParser = express.json();
app.use((req, res, next) => {
  // Use the json parser but catch parse errors and return 400
  jsonParser(req, res, (err) => {
    if (err) {
      console.error('Invalid JSON payload:', err && err.message);
      return res.status(400).json({ error: 'Invalid JSON payload.' });
    }
    next();
  });
});
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
  
  // Mount main API router

  app.use("/", apiRoutes);

  // Catch-all 404 handler
  app.use((req, res, next) => {
    const err = new Error(`Not Found: ${req.originalUrl}`);
    err.statusCode = 404;
    next(err);
  });

  // Custom error handler
  const errorHandler = require("./server/middleware/errorHandler.js");
  app.use(errorHandler);

  // Start the server. In local dev we prefer HTTPS when certs are available,
  // but don't crash if the PEM files are missing — fall back to HTTP to make
  // local development easier (avoids requiring users to create certs).
  try {
    const key = fs.readFileSync(path.resolve(__dirname, './localhost+2-key.pem'));
    const cert = fs.readFileSync(path.resolve(__dirname, './localhost+2.pem'));
    https.createServer({ key, cert }, app).listen(port, () => {
      console.log(`HTTPS server listening on ${process.env.BACKEND_URL || `https://127.0.0.1:${port}`}`);
      console.log(`Current Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.warn('HTTPS certs not available or unreadable, falling back to HTTP for development:', err && err.message);
    app.listen(port, () => {
      console.log(`HTTP server listening on http://127.0.0.1:${port}`);
      console.log(`Current Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  }
}


// =============================================================================
// START SERVER
// =============================================================================

// Call the initialization function to start the entire server setup process.
initializeApp();
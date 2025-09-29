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
async function initializeApp() {

    // Validate that the PORT environment variable is defined before proceeding.
    if (!port) {
        console.error("FATAL ERROR: PORT is not defined in your .env file. Server cannot start.");
        process.exit(1); // Exit the process with an error code.
    }
    
    // Define a simple root route to confirm the server is running.
    app.get('/', (req, res) => {
        res.send('Welcome to the RIT TA Portal Backend!');
    });

    // Mount the main API router. All requests to '/api' will be handled by this router.
    app.use('/api', apiRoutes);

    // Use HTTPS in development, HTTP in production (nginx handles SSL)
    if (process.env.NODE_ENV === 'production') {
        // HTTP server for production (behind nginx proxy)
        app.listen(port, () => {
            console.log(`Server listening on port ${port} in production mode`);
            console.log(`Current Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    } else {
        // HTTPS server for local development
        const httpsOptions = {
            key: fs.readFileSync('./localhost+2-key.pem'),
            cert: fs.readFileSync('./localhost+2.pem')
        };
        https.createServer(httpsOptions, app).listen(port, () => {
            console.log(`Server listening on ${process.env.BACKEND_URL}`);
            console.log(`Current Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    }
}

// =============================================================================
// START SERVER
// =============================================================================

// Call the initialization function to start the entire server setup process.
initializeApp();
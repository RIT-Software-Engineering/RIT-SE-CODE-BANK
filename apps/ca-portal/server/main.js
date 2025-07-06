require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT;
const cors = require('cors');
const https = require('https');
const fs = require('fs'); 
const devcert = require('devcert'); 

const setupDatabase = require('./server/database/setup_db');
const apiRoutes = require('./server/routing/index');

app.use(cors());
app.use(express.json()); // Middleware for JSON body parsing

async function initializeDatabase() {
    // MOVE THE devcert call HERE
    const httpsOptions = await devcert.certificateFor('localhost');

    console.log(`PORT variable is currently: ${port}`);
    if (!port) {
        console.error("FATAL ERROR: PORT is not defined in your .env file. Server cannot start.");
        process.exit(1);
    }
    // ... rest of the function is the same
    if (process.env.NODE_ENV !== 'production') {
        console.log("Running database setup for development environment.");
        try {
            await setupDatabase();
            console.log("Database setup completed.");
        } catch (error) {
            console.error("Failed to complete database setup.", error);
            process.exit(1);
        }
    } else {
        console.log("Running in production environment. Skipping database setup.");
    }
    
    app.get('/', (req, res) => {
        res.send('Welcome to the RIT CA Portal Backend!');
    });
    app.use('/api', apiRoutes);

    https.createServer(httpsOptions, app).listen(port, () => {
        console.log(`Server listening on ${process.env.BACKEND_URL}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

initializeDatabase();
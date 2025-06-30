require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT;
const cors = require('cors');
const https = require('https');
const fs = require('fs');  

const setupDatabase = require('./server/database/setup_db');
const apiRoutes = require('./server/routing/index');

app.use(cors());
app.use(express.json()); // Middleware for JSON body parsing

const httpsOptions = {
    key: fs.readFileSync('key.pem'),
    cert: fs.readFileSync('cert.pem')
};

async function initializeDatabase() {
    console.log(`PORT variable is currently: ${port}`);
    if (!port) {
        console.error("FATAL ERROR: PORT is not defined in your .env file. Server cannot start.");
        process.exit(1); // Exit if no port is specified
    }

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
    
    // --- API Routes ---
    app.get('/', (req, res) => {
        res.send('Welcome to the RIT CA Portal Backend!');
    });

    // Mount all routes from your routing index
    app.use('/api', apiRoutes);

    // --- Start Server ---
    https.createServer(httpsOptions, app).listen(port, () => {
        console.log(`Server listening on ${process.env.BASE_URL}`);
        console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
}

initializeDatabase();
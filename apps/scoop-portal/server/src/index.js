const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

// Initialize SQLite database for SCOOP Portal
let Logger;
try {
  Logger = require('../server/logger');
} catch (err) {
  // If logger module is not available, create a simple logger
  Logger = {
    log: (msg) => console.log(`[LOG] ${msg}`),
    error: (msg) => console.error(`[ERROR] ${msg}`)
  };
}

// Initialize database if in development mode
if (process.env.NODE_ENV === 'development') {
  try {
    const initializeDatabase = require('../server/database/init_db');
    Logger.log('Checking if database needs to be initialized...');
    initializeDatabase(false)
      .then(() => {
        Logger.log('Database initialization check completed');
      })
      .catch((err) => {
        Logger.error(`Database initialization failed: ${err.message}`);
      });
  } catch (err) {
    Logger.error(`Failed to load database initialization module: ${err.message}`);
  }
}

const app = express();

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.BASE_URL || "http://localhost:3000",
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Basic route for testing
app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Add a basic API route for database access
app.get('/api/users', (req, res) => {
  try {
    const DBHandler = require('../server/database/db');
    const db = new DBHandler();
    db.query('SELECT system_id, fname, lname, type FROM users LIMIT 10')
      .then(users => {
        res.json(users);
      })
      .catch(err => {
        Logger.error(`Error fetching users: ${err.message}`);
        res.status(500).json({ error: 'Failed to fetch users' });
      });
  } catch (err) {
    Logger.error(`Error loading database module: ${err.message}`);
    res.status(500).json({ error: 'Database module not available' });
  }
});

// Add a basic API route for projects
app.get('/api/projects', (req, res) => {
  try {
    const DBHandler = require('../server/database/db');
    const db = new DBHandler();
    db.query('SELECT project_id, title, status FROM projects LIMIT 10')
      .then(projects => {
        res.json(projects);
      })
      .catch(err => {
        Logger.error(`Error fetching projects: ${err.message}`);
        res.status(500).json({ error: 'Failed to fetch projects' });
      });
  } catch (err) {
    Logger.error(`Error loading database module: ${err.message}`);
    res.status(500).json({ error: 'Database module not available' });
  }
});

// Load routes if available and not in development mode
try {
  const routing = require('../server/routing/index');
  app.use('/', routing);
  Logger.log('Loaded routing module');
} catch (err) {
  Logger.error(`Failed to load routing module: ${err.message}`);
  // Add a fallback route
  app.get('/', (req, res) => {
    res.send('SCOOP Portal API is running');
  });
}

// Environment variables
const PORT = process.env.PORT || 3001;

// Start server
app.listen(PORT, () => {
  Logger.log(`Server running on port ${PORT}`);
}); 
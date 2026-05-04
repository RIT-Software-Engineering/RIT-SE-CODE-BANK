// server/server/routing/index.js

/**
 * =============================================================================
 * Main API Router
 *
 * This file serves as the central hub for all API routes in the application.
 * It imports specialized routers (e.g., for database interactions, Slack API)
 * and mounts them on specific base paths. This modular approach keeps the
 * routing logic clean, organized, and easy to maintain.
 *
 * All routes defined here will be prefixed with `/ta-portal-api`. For example, a route
 * defined as `/users` in `db_routes.js` will be accessible at `/ta-portal-api/db/users`.
 * =============================================================================
 */

"use strict";

// =============================================================================
// IMPORTS & SETUP
// =============================================================================

// Import Express to create an app and router for mounting routes. Export an
// Express application so tests (and Supertest) can require this module and
// exercise the routes directly.
const express = require("express");
const router = express.Router();

// Import the database-specific routes from the `db_routes.js` file.
const db_router = require("./db_routes");

// Import the Slack-specific routes from the `slack_routes.js` file.
const slack_router = require("./slack_routes");
const devNotifyRoutes = require('./dev_notify_routes');
const notificationsApi = require('./notifications_api');

// Import feature flag utilities
const { isFeatureEnabled, FEATURES } = require("../config/featureFlags");

// =============================================================================
// ROUTE MOUNTING
// =============================================================================

// Mount the database router. All routes defined in `db_routes.js` will now
// be accessible under the `/ta-portal-api/db` path.
router.use("/db", db_router);

// Mount the Slack router conditionally based on MESSAGING feature flag
// All routes defined in `slack_routes.js` will be accessible under `/ta-portal-api/slack`
// only if the messaging feature is enabled.
router.use("/slack", async (req, res, next) => {
  if (await isFeatureEnabled(FEATURES.MESSAGING)) {
    return slack_router(req, res, next);
  }
  res.status(404).json({ error: "Messaging feature is currently disabled." });
});

// Mount dev notification and notifications API routes
router.use('/dev', devNotifyRoutes);
router.use('/notifications', notificationsApi);


router.get("/health", async (req, res) => {
  try {
    res.status(200).json({
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({
      status: 'error'
    });
  }
});

/**
 * @route   POST /ta-portal-api/login-mode
 * @desc    Get which login mode is supported by the backend. Informs the frontend to what login menu it should use.
 * @access  Public
 * @returns {string} The current login mode (dev, prod, shibb)
 */
router.get("/login-mode", async (req, res) => {
  try{
    res.status(200).json({ loginMode: process.env.LOGIN_MODE });
  } catch (e){
    res.status(500).json({
      status: 'error'
    });
  }
})

// =============================================================================
// EXPORTS
// =============================================================================

// Export the router directly so it can be mounted at `/ta-portal-api` in main.js
// For tests, create a separate app instance when needed
module.exports = router;
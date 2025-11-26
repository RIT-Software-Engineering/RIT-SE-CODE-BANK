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
 * All routes defined here will be prefixed with `/api`. For example, a route
 * defined as `/users` in `db_routes.js` will be accessible at `/api/db/users`.
 * =============================================================================
 */

"use strict";

// =============================================================================
// IMPORTS & SETUP
// =============================================================================

// Import the Express Router to create modular, mountable route handlers.
const router = require("express").Router();

// Import the database-specific routes from the `db_routes.js` file.
const db_router = require("./db_routes");

// Import the Slack-specific routes from the `slack_routes.js` file.
const slack_router = require("./slack_routes");

// Import feature flag utilities
const { isFeatureEnabled, FEATURES } = require("../config/featureFlags");

// =============================================================================
// ROUTE MOUNTING
// =============================================================================

// Mount the database router. All routes defined in `db_routes.js` will now
// be accessible under the `/api/db` path.
router.use("/db", db_router);

// Mount the Slack router conditionally based on MESSAGING feature flag
// All routes defined in `slack_routes.js` will be accessible under `/api/slack`
// only if the messaging feature is enabled.
router.use("/slack", async (req, res, next) => {
  if (await isFeatureEnabled(FEATURES.MESSAGING)) {
    return slack_router(req, res, next);
  }
  res.status(404).json({ error: "Messaging feature is currently disabled." });
});

// =============================================================================
// EXPORTS
// =============================================================================

// Export the configured main router to be used by the main server file (e.g., server.js).
module.exports = router;
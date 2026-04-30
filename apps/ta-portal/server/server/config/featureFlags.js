// server/server/config/featureFlags.js

/**
 * =============================================================================
 * Feature Flags Configuration
 *
 * This module provides a simple hybrid approach to feature flags:
 * 1. Checks the database for runtime toggles (set by admins)
 * 2. Falls back to environment variables if DB entry doesn't exist
 * 3. Defaults to 'true' if neither is configured
 *
 * Usage:
 *   const { isFeatureEnabled } = require('./config/featureFlags');
 *   if (await isFeatureEnabled('MESSAGING')) { ... }
 * =============================================================================
 */

"use strict";

const { PrismaClient } = require("@prisma/client");

// Create a singleton Prisma client to prevent connection pool exhaustion
const globalForPrisma = global;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * Feature flag names enum for consistency
 */
const FEATURES = {
  MESSAGING: "MESSAGING",
  TIMECARD: "TIMECARD",
  POSITIONS: "POSITIONS",
  APPLICATIONS: "APPLICATIONS",
  PROFILES: "PROFILES",
  KRONOS: "KRONOS",
  ORACLE: "ORACLE",
  WORKDAY: "WORKDAY",
  SLACK_WORKSPACE_URL: "SLACK_WORKSPACE_URL",
};

/**
 * Check if a feature is enabled
 * 
 * @param {string} featureName - Name of the feature (use FEATURES enum)
 * @returns {Promise<boolean>} - True if feature is enabled
 */
async function isFeatureEnabled(featureName) {
  try {
    // Get from database
    const flag = await prisma.featureFlag.findUnique({
      where: { name: featureName },
    });

    if (flag !== null) {
      return flag.enabled;
    }

    // Default to true if not in database
    return true;
  } catch (error) {
    console.error(`Error checking feature flag ${featureName}:`, error);
    // On error, default to true
    return true;
  }
}

/**
 * Get all feature flags with their status
 * 
 * @returns {Promise<Object>} - Object mapping feature names to enabled status
 */
async function getAllFeatureFlags() {
  const flags = {};
  
  for (const feature of Object.values(FEATURES)) {
    flags[feature] = await isFeatureEnabled(feature);
  }
  
  return flags;
}

/**
 * Update a feature flag in the database
 * 
 * @param {string} featureName - Name of the feature
 * @param {boolean} enabled - Whether the feature should be enabled
 * @returns {Promise<Object>} - Updated feature flag record
 */
async function updateFeatureFlag(featureName, enabled) {
  return await prisma.featureFlag.upsert({
    where: { name: featureName },
    update: { enabled },
    create: { name: featureName, enabled },
  });
}

module.exports = {
  FEATURES,
  isFeatureEnabled,
  getAllFeatureFlags,
  updateFeatureFlag,
};

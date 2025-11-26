// ui/src/configuration/featureFlags.js

/**
 * =============================================================================
 * Frontend Feature Flags Configuration
 *
 * Dynamic feature flag checking that fetches from the backend API.
 * Falls back to environment variables if API is unavailable.
 * 
 * Usage:
 *   import { useFeatureFlags, FEATURES } from '@/configuration/featureFlags';
 *   
 *   // In a component:
 *   const { isFeatureEnabled, loading } = useFeatureFlags();
 *   if (isFeatureEnabled(FEATURES.MESSAGING)) { ... }
 * =============================================================================
 */

import { useState, useEffect } from 'react';

/**
 * Feature flag names enum for consistency with backend
 */
export const FEATURES = {
  MESSAGING: "MESSAGING",
  TIMECARD: "TIMECARD",
  POSITIONS: "POSITIONS",
  APPLICATIONS: "APPLICATIONS",
  PROFILES: "PROFILES",
  KRONOS: "KRONOS",
  ORACLE: "ORACLE",
};

// Cache for feature flags to avoid excessive API calls
let featureFlagsCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 30000; // 30 seconds

/**
 * Fetch feature flags from the backend API
 * 
 * @returns {Promise<Object>} - Object mapping feature names to enabled status
 */
export async function fetchFeatureFlags() {
  // Return cached flags if still fresh
  if (featureFlagsCache && cacheTimestamp && (Date.now() - cacheTimestamp < CACHE_DURATION)) {
    return featureFlagsCache;
  }

  try {
    const baseUrl = process.env.NEXT_PUBLIC_BACKEND_URL + process.env.NEXT_PUBLIC_API_EXTENSION;
    const dbExtension = process.env.NEXT_PUBLIC_DATABASE_API_EXTENSION;
    const response = await fetch(`${baseUrl}${dbExtension}/feature-flags`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch feature flags');
    }
    
    const flags = await response.json();
    
    // Backend returns an object like { MESSAGING: true, TIMECARD: false, ... }
    // Update cache
    featureFlagsCache = flags;
    cacheTimestamp = Date.now();
    
    return flags;
  } catch (error) {
    console.error('Error fetching feature flags, defaulting to all enabled:', error);
    
    // On error, default all features to enabled
    const flags = {};
    for (const feature of Object.values(FEATURES)) {
      flags[feature] = true;
    }
    
    return flags;
  }
}

/**
 * React hook for using feature flags in components
 * 
 * @returns {Object} - { isFeatureEnabled, loading, flags }
 */
export function useFeatureFlags() {
  const [flags, setFlags] = useState(featureFlagsCache || {});
  const [loading, setLoading] = useState(!featureFlagsCache);

  useEffect(() => {
    let mounted = true;

    const loadFlags = async () => {
      try {
        const fetchedFlags = await fetchFeatureFlags();
        if (mounted) {
          setFlags(fetchedFlags);
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading feature flags:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    loadFlags();

    return () => {
      mounted = false;
    };
  }, []);

  const isFeatureEnabled = (featureName) => {
    // Only return true if explicitly set to true in flags
    return flags[featureName] === true;
  };

  return { isFeatureEnabled, loading, flags };
}

/**
 * Legacy synchronous check (uses cached values only)
 * For SSR/static contexts - defaults to true if not cached
 * 
 * @param {string} featureName - Name of the feature
 * @returns {boolean} - True if feature is enabled
 */
export function isFeatureEnabled(featureName) {
  if (featureFlagsCache && featureFlagsCache[featureName] !== undefined) {
    return featureFlagsCache[featureName];
  }
  
  // Default to enabled if not cached
  return true;
}

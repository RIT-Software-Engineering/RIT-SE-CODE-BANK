const express = require('express');
const router = express.Router();

// notification-client (CJS build)
const notificationClient = require('../../../../../packages/notification-client/index.cjs');

// GET /api/notifications/preferences/:appId/:identifier
router.get('/preferences/:appId/:identifier', async (req, res) => {
  const { appId, identifier } = req.params;
  try {
    const prefs = await notificationClient.getPreferences(identifier);
    return res.json(prefs);
  } catch (err) {
    console.error('Failed to fetch preferences from notification service:', err && err.message);
    return res.status(502).json({ error: 'Failed to fetch preferences', detail: String(err) });
  }
});

// PUT /api/notifications/preferences/:appId/:identifier
router.put('/preferences/:appId/:identifier', async (req, res) => {
  const { appId, identifier } = req.params;
  const body = req.body || {};
  try {
    // Ensure the service has a username to canonicalize identity when userEmail
    // is not provided. Try to fetch existing prefs to see if a canonical email
    // is already known for this identifier (helps avoid 400 from the service).
    const payload = { ...body };
    if (!payload.userEmail && !payload.username && identifier && !identifier.includes('@')) {
      payload.username = identifier;
    }

    try {
      const existing = await notificationClient.getPreferences(identifier);
      if (existing && existing.userEmail && !payload.userEmail) {
        payload.userEmail = existing.userEmail;
      }
    } catch (e) {
      // ignore — we'll still attempt the upsert and the service may accept username
    }

    // If still no canonical email, synthesize a placeholder email from the username
    // (matches the notification-service in-memory fallback behavior).
    if (!payload.userEmail && payload.username) {
      try {
        payload.userEmail = String(payload.username).trim().toLowerCase() + '@example.invalid';
      } catch (e) {
        // ignore
      }
    }

    try {
      const result = await notificationClient.setPreferences(identifier, payload);
      return res.json(result);
    } catch (err) {
      // Log payload and error detail to help debugging
      console.error('notifications_api: setPreferences payload=', JSON.stringify(payload));
      console.error('notifications_api: setPreferences error=', err && err.message);
      throw err;
    }
  } catch (err) {
    console.error('Failed to set preferences via notification service:', err && err.message);
    return res.status(502).json({ error: 'Failed to set preferences', detail: String(err) });
  }
});

// GET /api/notifications/recent/:appId/:identifier
router.get('/recent/:appId/:identifier', async (req, res) => {
  const { appId, identifier } = req.params;
  const { limit = 5, page = 0 } = req.query || {};
  try {
    // Try the identifier as provided first (frontend typically passes username)
    let data = await notificationClient.getRecent(identifier, { limit: Number(limit), page: Number(page) });

    // If nothing found and identifier looks like a username (no '@'), try email variant
    // Many callers store notifications under email (r.email) while the frontend requests by username.
    if ((!Array.isArray(data) || data.length === 0) && identifier && !identifier.includes('@')) {
      try {
        const alt = `${identifier}@rit.edu`;
        const altData = await notificationClient.getRecent(alt, { limit: Number(limit), page: Number(page) });
        if (Array.isArray(altData) && altData.length > 0) data = altData;
      } catch (e) {
        // ignore and keep original data
      }
    }

    // If identifier was an email but no results, try username fallback (strip domain)
    if ((!Array.isArray(data) || data.length === 0) && identifier && identifier.includes('@')) {
      try {
        const username = String(identifier.split('@', 1)[0]).toLowerCase();
        const altData = await notificationClient.getRecent(username, { limit: Number(limit), page: Number(page) });
        if (Array.isArray(altData) && altData.length > 0) data = altData;
      } catch (e) {
        // ignore
      }
    }

    return res.json(data || []);
  } catch (err) {
    console.error('Failed to fetch recent notifications:', err && err.message);
    return res.status(502).json({ error: 'Failed to fetch recent notifications', detail: String(err) });
  }
});

module.exports = router;

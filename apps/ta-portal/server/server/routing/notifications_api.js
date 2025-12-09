const express = require('express');
const router = express.Router();

// Local notifications util that calls the service directly
const notificationClient = require('../utils/notifications');

// GET /api/notifications/preferences/:appId/:identifier
router.get('/preferences/:appId/:identifier', async (req, res) => {
  const { appId, identifier } = req.params;
  try {
    console.log(`[notifications_api] GET prefs appId=${appId} id=${identifier}`);
    const prefs = await notificationClient.getPreferences(identifier, appId);
    console.log(`[notifications_api] GET prefs ->`, prefs);
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
    // Only forward toggles from the UI to avoid overwriting contact fields.
    // Contact details are managed by the system (seed, admin tools, or future SSO sync).
    const payload = {
      ...(Object.prototype.hasOwnProperty.call(body, 'notifyEmail') ? { notifyEmail: !!body.notifyEmail } : {}),
      ...(Object.prototype.hasOwnProperty.call(body, 'notifySlack') ? { notifySlack: !!body.notifySlack } : {}),
    };

    try {
      console.log(`[notifications_api] PUT prefs appId=${appId} id=${identifier} payload=`, payload);
      const result = await notificationClient.setPreferences(identifier, payload, appId);
      console.log(`[notifications_api] PUT prefs ->`, result);
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

// GET /api/notifications/preferences/:appId/:identifier/slack-status
router.get('/preferences/:appId/:identifier/slack-status', async (req, res) => {
  const { appId, identifier } = req.params;
  const { email } = req.query;
  
  if (!email) {
    return res.status(400).json({ error: 'email query parameter is required' });
  }
  
  try {
    console.log(`[notifications_api] GET slack-status appId=${appId} id=${identifier} email=${email}`);
    const result = await notificationClient.checkSlackStatus(email, appId, identifier);
    console.log(`[notifications_api] GET slack-status ->`, result);
    return res.json(result);
  } catch (err) {
    console.error('Failed to check Slack status:', err && err.message);
    return res.status(502).json({ error: 'Failed to check Slack status', detail: String(err) });
  }
});

// Dev-only helper to reset contact fields. Do NOT enable in production.
if (process.env.NODE_ENV !== 'production') {
  router.post('/preferences/:appId/:identifier/reset-contacts', async (req, res) => {
    const { appId, identifier } = req.params;
    try {
      const result = await notificationClient.setPreferences(identifier, { userEmail: null, slackUsername: null }, appId);
      return res.json({ ok: true, result });
    } catch (e) {
      return res.status(500).json({ ok: false, error: String(e && e.message || e) });
    }
  });
}

// GET /api/notifications/recent/:appId/:identifier
// Recent notifications removed — return empty list to maintain compatibility
router.get('/recent/:appId/:identifier', async (req, res) => {
  return res.json([]);
});

// POST /api/notifications/dispatch/:appId
// Proxies dispatch to the notification service. Supports simple and templated payloads.
router.post('/dispatch/:appId', async (req, res) => {
  const { appId } = req.params;
  const body = req.body || {};
  const { userId, userEmail } = body;

  if (!userId && !userEmail) {
    return res.status(400).json({ error: 'userId or userEmail is required' });
  }

  try {
    let result;
    if (body.event) {
      const { event, context = {}, role, subject } = body;
      console.log(`[notifications_api] POST dispatch (templated) appId=${appId} id=${userId || userEmail}`);
      result = await notificationClient.dispatchTemplated(
        userId || null,
        { event, context, role, subject, userEmail: userEmail || null },
        appId
      );
    } else {
      const { subject, message } = body;
      console.log(`[notifications_api] POST dispatch (simple) appId=${appId} id=${userId || userEmail}`);
      result = await notificationClient.dispatchNotification(
        userId || null,
        { subject, message, userEmail: userEmail || null },
        appId
      );
    }
    return res.json(result);
  } catch (err) {
    console.error('Failed to dispatch via notification service:', err && err.message);
    return res.status(502).json({ error: 'Failed to dispatch', detail: String(err) });
  }
});

module.exports = router;

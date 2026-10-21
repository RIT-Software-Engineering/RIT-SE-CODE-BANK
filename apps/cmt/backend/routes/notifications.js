import express from 'express';
import * as notificationClient from '../utils/notifications.js';
import {addNotification, sendDueNotifications } from '../utils/notifier.js';

// server/routing/notifications_api.js
const router = express.Router();

// Require that a user is logged in (authMiddleware should set req.user)
function requireUser(req, res) {
    if (!req.user) {
        res.status(401).json({ success: false, error: "Not authenticated" });
        return null;
    }
    return req.user;
}

/**
 * POST /api/cmt/notifications/notify
 */
router.post('/notify', async (req, res) => {
    const user = requireUser(req, res);
    const {courseId, details} = req.body;

    if (!user) return null;
    if (!courseId || !details) {
        return res.status(400).json({error: 'Missing required fields'});
    }
    await addNotification(courseId, details);
    await sendDueNotifications(user.uid, courseId);

    res.json({success: true});
});

/**
 * POST /api/cmt/notifications/send-due
 * Call this to check for and send due notifications
 */
router.post('/send-due', async (req, res) => {
    const user = requireUser(req, res);
    const {courseId} = req.body;
    if (!user) return null;

    await sendDueNotifications(user.uid, courseId);
    res.json({
        success: true
    });
});

// GET /api/notifications/preferences/:appId/:identifier
router.get('/preferences/:appId/:identifier', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return null;

    const { appId, identifier } = req.params;
    if (req.user.uid !== identifier) {
        res.status(403).json({
            success: false,
            error: "Unauthorized access"
        });
        return null;
    }
    try {
        const prefs = await notificationClient.getPreferences(identifier, appId);
        return res.json(prefs);
    } catch (err) {
        console.error('Failed to fetch preferences:', err.message);
        return res.status(502).json({ 
        error: 'Failed to fetch preferences', 
        detail: err.message 
        });
    }
});

// PUT /api/notifications/preferences/:appId/:identifier
router.put('/preferences/:appId/:identifier', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return null;

    const { appId, identifier } = req.params;
    const body = req.body || {};
  
    if (req.user.uid !== identifier) {
        res.status(403).json({
            success: false,
            error: "Unauthorized access"
        });
        return null;
    }

    try {
        // Only forward toggle fields to avoid overwriting contact info
        const payload = {
        ...(Object.prototype.hasOwnProperty.call(body, 'notifyEmail') ? { notifyEmail: !!body.notifyEmail } : {}),
        ...(Object.prototype.hasOwnProperty.call(body, 'notifySlack') ? { notifySlack: !!body.notifySlack } : {}),
        };
        
        const result = await notificationClient.setPreferences(identifier, payload, appId);
        return res.json(result);
    } catch (err) {
        console.error('Failed to set preferences:', err.message);
        return res.status(502).json({ 
        error: 'Failed to set preferences', 
        detail: err.message 
        });
    }
});

// GET /api/notifications/preferences/:appId/:identifier/slack-status
router.get('/preferences/:appId/:identifier/slack-status', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return null;

    const { appId, identifier } = req.params;
    const { email } = req.query;
    
    if (req.user.uid !== identifier) {
        res.status(403).json({
            success: false,
            error: "Unauthorized access"
        });
        return null;
    }

    if (!email) {
        return res.status(400).json({ error: 'email query parameter is required' });
    }
    
    try {
        const result = await notificationClient.checkSlackStatus(email, appId, identifier);
        return res.json(result);
    } catch (err) {
        console.error('Failed to check Slack status:', err.message);
        return res.status(502).json({ 
        error: 'Failed to check Slack status', 
        detail: err.message 
        });
    }
});

export default router;
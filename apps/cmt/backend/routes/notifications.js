import express from 'express';
import {PrismaClient} from '../prisma/generated/client/index.js'
import * as notificationClient from '../utils/notifications.js';
import {deleteNotification, previewNotifications, sendDueNotifications } from '../utils/notifier.js';

// server/routing/notifications_api.js
const router = express.Router();

const prisma = new PrismaClient();

// Require that a user is logged in (authMiddleware should set req.user)
function requireUser(req, res) {
    if (!req.user) {
        res.status(401).json({ success: false, error: "Not authenticated" });
        return null;
    }
    return req.user;
}

// Require that the course belongs to the user
async function requireCourse(req, res, courseId){
    const id = parseInt(courseId);

    const course = await prisma.course.findUnique({where: {id}});

    if (!course){
        res.status(404).json({success: false, error: "Course not found"});
        return null;
    }

    if (course.professorId !== req.user.uid){
        res.status(403).json({success: false, error: "Unauthorized access"});
        return null;
    }
    return course;
}

/**
 * POST /api/cmt/notifications/send-due
 * Call this to check for and send due notifications
 */
router.post('/send-due', async (req, res) => {
    const user = requireUser(req, res);
    const {courseId} = req.body;
    if (!user) return null;

    if (!courseId) {
        return res.status(400).json({error: 'Missing courseId'});
    }

    const course = await requireCourse(req, res, courseId);
    if (!course) return null;

    const result = await sendDueNotifications(user.uid, courseId);
    res.json({
        success: true, result
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

/**
 * GET /api/cmt/notifications/course/:courseId/pending
 */
router.get('/course/:courseId/pending', async (req, res) => {
    const user = requireUser(req, res);
    if (!user) return null;
    const {courseId} = req.params;
    if (!courseId){
        return res.status(400).json({error: 'Missing courseId'});
    }

    const course = await requireCourse(req, res, courseId);
    if (!course) return null;

    const pending = await prisma.notification.findMany({
        where: {courseId: course.id, status: {in: ['SCHEDULED', 'FAILED']}},
        orderBy: {sendAt: 'asc'},
        select: {id: true, event: true, context: true, sendAt: true, status: true}
    });

    res.json({success: true, pending});
});

/**
 * POST /api/cmt/notifications/:id/cancel
 * Cancel a scheduled notification
 */
router.post('/:id/cancel', async (req, res) => {
    const user = requireUser(req, res);
    const {id} = req.params;
    if (!user) return null;

    const row = await prisma.notification.findUnique({
        where: {id: parseInt(id)}
    });
    if (!row) return res.status(404).json({
        success: false, error: 'Notification not found'
    });

    const course = await requireCourse(req, res, row.courseId);
    if (!course) return null;

    const cancelled = await deleteNotification(row.id);
    res.json({success: cancelled});
})

router.post('/preview', async (req, res) => {
    const user = requireUser(req, res);
    const {courseId, until} = req.body;

    if (!user) return null;
    if (!courseId || !until) {
        return res.status(400).json({error: 'Missing courseId or until'});
    }

    const course = await requireCourse(req, res, courseId);
    if (!course) return null;
    const untilDate = new Date(`${until}T23:59:59.999`);    

    if (isNaN(untilDate.getTime())) return res.status(400).json({error: 'Invalid until date'});
    const result = await previewNotifications(parseInt(courseId), untilDate)
    res.json({success: true, ...result});
})

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
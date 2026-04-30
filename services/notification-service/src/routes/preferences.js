import { Router } from "express";
import axios from "axios";
import { getPrisma } from '../db.js';

const router = Router();

/**
 * Normalizes email address to lowercase without whitespace.
 * @param {string} e - Email address
 * @returns {string} Normalized email
 */
function normalizeEmail(e) {
  return (e || "").trim().toLowerCase();
}

/**
 * GET /api/notifications/preferences/:appId/:userId
 * Retrieves notification preferences for a user. Returns defaults if no record exists.
 */
router.get("/:appId/:userId", async (req, res) => {
  const { appId, userId } = req.params;
  try {
    const prisma = getPrisma();
    const pref = await prisma.userPreference.findUnique({
      where: { appId_userId: { appId, userId } },
    });
    if (!pref) {
      // return defaults when no record exists
      return res.json({
        appId,
        userId,
        notifyEmail: true,
        notifySlack: false,
        userEmail: null,
      });
    }
    return res.json({
      appId: pref.appId,
      userId: pref.userId,
      notifyEmail: !!pref.notifyEmail,
      notifySlack: !!pref.notifySlack,
      userEmail: pref.userEmail || null,
    });
  } catch (e) {
    console.error('preferences:get error', e?.message || e);
    return res.status(500).json({ error: 'Failed to load preferences' });
  }
});

/**
 * PUT /api/notifications/preferences/:appId/:userId
 * Updates notification preferences for a user. Creates record if it doesn't exist.
 * Body: { notifyEmail?: boolean, notifySlack?: boolean, userEmail?: string }
 */
router.put("/:appId/:userId", async (req, res) => {
  const { appId, userId } = req.params;
  const { notifyEmail, notifySlack, userEmail } = req.body || {};
  try {
    const prisma = getPrisma();
    const upserted = await prisma.userPreference.upsert({
      where: { appId_userId: { appId, userId } },
      create: {
        appId,
        userId,
        userEmail: userEmail ? normalizeEmail(userEmail) : null,
        notifyEmail: notifyEmail ?? true,
        notifySlack: notifySlack ?? false,
      },
      update: {
        userEmail: userEmail === undefined ? undefined : (userEmail ? normalizeEmail(userEmail) : null),
        notifyEmail: notifyEmail === undefined ? undefined : !!notifyEmail,
        notifySlack: notifySlack === undefined ? undefined : !!notifySlack,
      },
    });
    return res.json({
      ok: true,
      preference: {
        appId: upserted.appId,
        userId: upserted.userId,
        notifyEmail: !!upserted.notifyEmail,
        notifySlack: !!upserted.notifySlack,
        userEmail: upserted.userEmail || null,
      },
    });
  } catch (e) {
    console.error('preferences:put error', e?.message || e);
    return res.status(500).json({ error: 'Failed to save preferences' });
  }
});

/**
 * GET /api/notifications/preferences/:appId/:userId/slack-status
 * Checks if a user is a member of the configured Slack workspace.
 * Query params: email (required)
 * Returns: { inWorkspace: boolean, userId?: string, reason?: string }
 */
router.get("/:appId/:userId/slack-status", async (req, res) => {
  const { appId, userId } = req.params;
  const { email } = req.query;
  
  if (!process.env.SLACK_BOT_TOKEN) {
    return res.json({ inWorkspace: false, reason: 'slack_not_configured' });
  }
  
  if (!email) {
    return res.json({ inWorkspace: false, reason: 'no_email_provided' });
  }
  
  try {
    const normalizedEmail = normalizeEmail(email);
    
    const resp = await axios.get(
      "https://slack.com/api/users.lookupByEmail",
      { 
        headers: { 
          Authorization: `Bearer ${process.env.SLACK_BOT_TOKEN}`,
          "Content-Type": "application/json; charset=utf-8"
        },
        params: { email: normalizedEmail }
      }
    );
    
    if (resp.data?.ok) {
      return res.json({ inWorkspace: true, userId: resp.data.user.id });
    } else if (resp.data?.error === 'users_not_found') {
      return res.json({ inWorkspace: false, reason: 'not_in_workspace' });
    } else {
      return res.json({ inWorkspace: false, reason: resp.data?.error || 'unknown_error' });
    }
  } catch (e) {
    console.error('slack-status check error', e?.message || e);
    return res.status(500).json({ error: 'Failed to check Slack status' });
  }
});

export default router;

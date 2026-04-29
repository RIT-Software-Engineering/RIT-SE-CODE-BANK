import { Router } from "express";
import { getPrisma } from '../db.js';

const router = Router();

function normalizeEmail(e) {
  return (e || "").trim().toLowerCase();
}

// GET /api/notifications/preferences/:appId/:userId
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
        slackUsername: null,
      });
    }
    return res.json({
      appId: pref.appId,
      userId: pref.userId,
      notifyEmail: !!pref.notifyEmail,
      notifySlack: !!pref.notifySlack,
      userEmail: pref.userEmail || null,
      slackUsername: pref.slackUsername || null,
    });
  } catch (e) {
    console.error('preferences:get error', e?.message || e);
    return res.status(500).json({ error: 'Failed to load preferences' });
  }
});

// PUT /api/notifications/preferences/:appId/:userId
// Body: { notifyEmail?: boolean, notifySlack?: boolean, userEmail?: string, slackUsername?: string }
router.put("/:appId/:userId", async (req, res) => {
  const { appId, userId } = req.params;
  const { notifyEmail, notifySlack, userEmail, slackUsername } = req.body || {};
  try {
    const prisma = getPrisma();
    const upserted = await prisma.userPreference.upsert({
      where: { appId_userId: { appId, userId } },
      create: {
        appId,
        userId,
        userEmail: userEmail ? normalizeEmail(userEmail) : null,
        slackUsername: slackUsername || null,
        notifyEmail: notifyEmail ?? true,
        notifySlack: notifySlack ?? false,
      },
      update: {
        userEmail: userEmail === undefined ? undefined : (userEmail ? normalizeEmail(userEmail) : null),
        slackUsername: slackUsername === undefined ? undefined : (slackUsername || null),
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
        slackUsername: upserted.slackUsername || null,
      },
    });
  } catch (e) {
    console.error('preferences:put error', e?.message || e);
    return res.status(500).json({ error: 'Failed to save preferences' });
  }
});

export default router;

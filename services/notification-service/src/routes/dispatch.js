import { Router } from "express";
import { getPrisma } from "../db.js";
import { sendEmail } from "../channels/email.js";
import { resolveDmChannel, sendSlackMessage } from "../channels/slack.js";
import { defaultSubject, renderEmail, renderSlack, normalizeEventKey } from "../lib/templates.js";
import { resolveUserEmail } from "../lib/identity.js";

const router = Router();

function ts() {
  return new Date().toISOString();
}

// POST /api/notifications/dispatch/:appId
// Body supports either:
//  A) { userId, subject, message }
//  B) { userId, event, context, role?, subject? }  -> uses Handlebars templates if available
router.post("/:appId", async (req, res) => {
  const { appId } = req.params;
  // Accept either userId or userEmail; derive userId from email if not provided
  const providedEmail = (req.body?.userEmail || "").trim().toLowerCase() || null;
  let { userId } = req.body || {};
  if (!userId && providedEmail && providedEmail.includes("@")) {
    userId = providedEmail.split("@", 1)[0];
  }
  if (!userId && !providedEmail) return res.status(400).json({ error: "userId or userEmail is required" });
  const providedSubject = req.body?.subject;
  const providedMessage = req.body?.message;
  const event = req.body?.event ? normalizeEventKey(req.body.event) : null;
  const context = req.body?.context || null;
  const role = req.body?.role || 'recipient';

  try {
    const prisma = getPrisma();
    const pref = await prisma.userPreference.findUnique({ where: { appId_userId: { appId, userId } } });

    // Default behavior: if no preferences exist, default to email-only BUT requires a stored email
    const notifyEmail = pref ? !!pref.notifyEmail : true;
    const notifySlack = pref ? !!pref.notifySlack : false;
    let userEmail = providedEmail || pref?.userEmail || null;
    const slackUsername = pref?.slackUsername || null;

    // If email not stored, try to resolve from app backend (ta-portal)
    if (!userEmail && (notifyEmail || (notifySlack && process.env.SLACK_BOT_TOKEN))) {
      userEmail = await resolveUserEmail({ appId, userId });
    }

    const results = [];
    const errors = [];

    // EMAIL
    if (notifyEmail) {
      if (!userEmail) {
        errors.push({ channel: "email", error: "No userEmail on preference record" });
      } else {
        try {
          let subjectToSend = providedSubject || (event ? defaultSubject(role, context) : undefined);
          let html = undefined;
          let text = undefined;
          if (event) {
            const rendered = renderEmail({ event, role, appId, context, fallbackMessage: providedMessage });
            html = rendered.html;
            text = rendered.text;
            if (!subjectToSend) subjectToSend = defaultSubject(role, context);
          } else {
            // plain dispatch
            subjectToSend = subjectToSend || '(no subject)';
            text = providedMessage;
          }

          const info = await sendEmail({ to: userEmail, subject: subjectToSend, text, html });
          results.push({ channel: "email", messageId: info.messageId });
          console.log(`[dispatch][${ts()}] app=${appId} userId=${userId} email=ok to=${userEmail}`);
        } catch (e) {
          const err = e?.message || String(e);
          errors.push({ channel: "email", error: err });
          console.warn(`[dispatch][${ts()}] app=${appId} userId=${userId} email=fail ${err}`);
        }
      }
    }

    // SLACK
    if (notifySlack) {
      if (!process.env.SLACK_BOT_TOKEN) {
        errors.push({ channel: "slack", error: "SLACK_BOT_TOKEN not configured" });
      } else {
        try {
          // Prefer direct handle when provided; otherwise resolve by email
          const handle = slackUsername ? (slackUsername.startsWith("@") ? slackUsername : `@${slackUsername}`) : undefined;
          const channelId = await resolveDmChannel({ slack: handle, email: userEmail || undefined });
          let textToSend = '';
          if (event) {
            const rendered = renderSlack({ event, role, appId, context, fallbackText: `${providedSubject || defaultSubject(role, context)} — ${providedMessage || ''}` });
            textToSend = rendered.text;
          } else {
            textToSend = `${providedSubject || ''}${providedSubject && providedMessage ? ' — ' : ''}${providedMessage || ''}`.trim();
          }
          const resp = await sendSlackMessage({ channel: channelId, text: textToSend });
          results.push({ channel: "slack", ts: resp.ts, channelId });
          console.log(`[dispatch][${ts()}] app=${appId} userId=${userId} slack=ok to=${handle}`);
        } catch (e) {
          const err = e?.message || String(e);
          errors.push({ channel: "slack", error: err });
          console.warn(`[dispatch][${ts()}] app=${appId} userId=${userId} slack=fail ${err}`);
        }
      }
    }

    // Determine overall outcome: if any enabled channel failed, return 502. If none enabled, 422.
    const enabledCount = (notifyEmail ? 1 : 0) + (notifySlack ? 1 : 0);
    if (enabledCount === 0) {
      return res.status(422).json({ error: "No enabled channels for this user", results, errors });
    }
    if (errors.length > 0) {
      return res.status(502).json({ ok: false, results, errors });
    }

    return res.json({ ok: true, results });
  } catch (e) {
    console.error(`[dispatch][${ts()}] app=${appId} userId=${req.body?.userId} fatal`, e?.message || e);
    return res.status(500).json({ error: "Dispatch failed" });
  }
});

export default router;

import { Router } from "express";
import { getPrisma } from "../db.js";
import { sendEmail } from "../channels/email.js";
import { resolveDmChannel, sendSlackMessage } from "../channels/slack.js";
import { defaultSubject, renderEmail, renderSlack } from "../lib/templates.js";

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
  const event = req.body?.event ? String(req.body.event || '').trim().toLowerCase() : null;
  const context = req.body?.context || null;
  const role = req.body?.role || 'recipient';

  try {
    // Preferences are optional at runtime; if the DB is unavailable, fall back to sensible defaults.
    const prisma = getPrisma();
    let pref = null;
    try {
      pref = await prisma.userPreference.findUnique({ where: { appId_userId: { appId, userId } } });
    } catch (e) {
      console.warn(`[dispatch][${ts()}] app=${appId} userId=${userId} prefs=unavailable (${e?.message || e}) — using defaults`);
      pref = null;
    }

    // Default behavior: if no preferences exist, default to email-only BUT requires a stored email
  const notifyEmail = pref ? !!pref.notifyEmail : true;
  const notifySlack = pref ? !!pref.notifySlack : false;
    // Prefer explicitly provided email; then stored preference; then email embedded in context
    let userEmail = providedEmail || pref?.userEmail || null;
    if (!userEmail && context) {
      const ctxEmail = (
        // agnostic field only
        (context.recipient && context.recipient.email) ||
        ''
      ).trim().toLowerCase();
      if (ctxEmail.includes('@')) userEmail = ctxEmail;
    }

  const results = [];
  const errors = [];
  // Summary trackers
  let emailAttempted = notifyEmail;
  let emailSent = false;
  let emailToSummary = null;
  let emailErrorSummary = null;
  let slackAttempted = notifySlack;
  let slackSent = false;
  let slackToSummary = null;
  let slackErrorSummary = null;

    // EMAIL
    if (notifyEmail) {
      if (!userEmail) {
        emailErrorSummary = "No userEmail on preference record";
        errors.push({ channel: "email", error: emailErrorSummary });
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
          emailSent = true;
          emailToSummary = userEmail;
          console.log(`[dispatch][${ts()}] app=${appId} userId=${userId} email=ok to=${userEmail}`);
        } catch (e) {
          const err = e?.message || String(e);
          emailErrorSummary = err;
          errors.push({ channel: "email", error: err });
          console.warn(`[dispatch][${ts()}] app=${appId} userId=${userId} email=fail ${err}`);
        }
      }
    }

    // SLACK
    if (notifySlack) {
      if (!process.env.SLACK_BOT_TOKEN) {
        slackErrorSummary = "SLACK_BOT_TOKEN not configured";
        errors.push({ channel: "slack", error: slackErrorSummary });
      } else {
        try {
          // Resolve DM channel by email
          const channelId = await resolveDmChannel({ email: userEmail || undefined });
          let textToSend = '';
          if (event) {
            const rendered = renderSlack({ event, role, appId, context, fallbackText: `${providedSubject || defaultSubject(role, context)} — ${providedMessage || ''}` });
            textToSend = rendered.text;
          } else {
            textToSend = `${providedSubject || ''}${providedSubject && providedMessage ? ' — ' : ''}${providedMessage || ''}`.trim();
          }
          const resp = await sendSlackMessage({ channel: channelId, text: textToSend });
          results.push({ channel: "slack", ts: resp.ts, channelId });
          slackSent = true;
          slackToSummary = channelId;
          console.log(`[dispatch][${ts()}] app=${appId} userId=${userId} slack=ok to=${channelId}`);
        } catch (e) {
          const err = e?.message || String(e);
          slackErrorSummary = err;
          errors.push({ channel: "slack", error: err });
          console.warn(`[dispatch][${ts()}] app=${appId} userId=${userId} slack=fail ${err}`);
        }
      }
    }

    // Dispatch summary log (what was enabled, sent, failed)
    const enabled = [ ...(notifyEmail ? ['email'] : []), ...(notifySlack ? ['slack'] : []) ];
    const sent = results.map(r => r.channel);
    const failed = errors.map(e => e.channel);
    console.log(
      `[dispatch][${ts()}] app=${appId} userId=${userId} event=${event || 'plain'} role=${role} ` +
      `email(attempted=${emailAttempted} sent=${emailSent} to=${emailToSummary || '-'}${emailErrorSummary ? ` error="${emailErrorSummary}"` : ''}) ` +
      `slack(attempted=${slackAttempted} sent=${slackSent} to=${slackToSummary || '-'}${slackErrorSummary ? ` error="${slackErrorSummary}"` : ''}) ` +
      `enabled=[${enabled.join(',') || '-'}] sent=[${sent.join(',') || '-'}] failed=[${failed.join(',') || '-'}]`
    );

    // Determine overall outcome: if any enabled channel failed, return 502. If none enabled, 422.
    const enabledCount = enabled.length;
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

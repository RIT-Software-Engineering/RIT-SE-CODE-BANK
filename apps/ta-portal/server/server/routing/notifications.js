const { prisma } = require('../database/prisma');
// Use the central notification client to read user preferences instead of
// querying a local NotificationPreference model.
const notificationClient = require('../../../../../packages/notification-client/index.cjs');

// Keep imports aligned with how tests mock the modules. The notification service
// channels may export different names depending on ESM/CJS shape or in tests
// they mock different named exports. Require the module and look up common
// function names used throughout the codebase/tests.
const emailChannel = require('@services/notification-service/src/channels/email');
const slackChannel = require('@services/notification-service/src/channels/slack');

const sendEmail = emailChannel.sendEmail || emailChannel.default || emailChannel;
const sendSlackDM = slackChannel.sendSlackDM || slackChannel.sendSlackMessage || slackChannel.default || slackChannel;

/**
 * dispatchNotification(username, payload)
 * - looks up user's notification preferences and sends email/slack
 * - payload: { subject, body, toEmail?, slackChannel? }
 */
async function dispatchNotification(username, payload = {}) {
  if (!username) throw new Error('username required');
  // notification-client expects an identifier; we use the username (client
  // maps to appId automatically via env or default). The client returns the
  // preference object { notifyEmail, notifySlack, userEmail, username }
  let prefs;
  try {
    prefs = await notificationClient.getPreferences(username);
  } catch (err) {
    // If the client call fails, default to email enabled, slack disabled.
    prefs = { notifyEmail: true, notifySlack: false };
  }
  const notifyEmail = prefs?.notifyEmail ?? true;
  const notifySlack = prefs?.notifySlack ?? false;

  const tasks = [];
  if (notifyEmail) {
    // tests only assert call counts; keep signature flexible
    tasks.push(sendEmail({ to: payload.toEmail || `${username}@rit.edu`, subject: payload.subject, text: payload.body }));
  }
  if (notifySlack) {
    tasks.push(sendSlackDM({ channel: payload.slackChannel || `@${username}`, text: payload.body }));
  }

  await Promise.all(tasks);
}

module.exports = { dispatchNotification };

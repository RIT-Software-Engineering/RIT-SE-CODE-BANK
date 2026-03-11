const DEFAULT_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4000';
if (process.env.NODE_ENV !== 'test') {
  // One-time debug log to aid diagnosing proxy target
  // eslint-disable-next-line no-console
  console.log(`[notifications-proxy] Using notification service at: ${DEFAULT_SERVICE_URL}`);
}
const APP_ID = process.env.NOTIFICATION_CLIENT_APP_ID || 'ta-portal';
const NOTIFICATION_API_EXTENSION = process.env.NOTIFICATION_API_EXTENSION

let fetchImpl;
try {
  fetchImpl = globalThis.fetch || require('node-fetch');
} catch (_) {
  const http = require('http');
  const https = require('https');
  fetchImpl = function(url, opts = {}) {
    return new Promise((resolve, reject) => {
      try {
        const u = new URL(url);
        const lib = u.protocol === 'https:' ? https : http;
        const req = lib.request(u, { method: opts.method || 'GET', headers: opts.headers || {} }, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: async () => text, json: async () => JSON.parse(text) });
          });
        });
        req.on('error', reject);
        if (opts.body) req.write(opts.body);
        req.end();
      } catch (err) { reject(err); }
    });
  };
}

/**
 * Get URL for preference access/manipulation
 * @param {*} userId user identifier linked to preferences
 * @returns String containing url to the preferences of the given user
 */
function prefUrl(userId) {
  return `${DEFAULT_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/preferences/${encodeURIComponent(APP_ID)}/${encodeURIComponent(userId)}`;
}

/**
 * Get user notification preferences
 * @param {*} userId user identifier linked to preferences
 * @returns a dictionary with the following keys:
 * appId(String), userId(String), notifyEmail(Bool), notifySlack(Bool), userEmail(String or null).
 */
async function getPreferences(userId) {
  const res = await fetchImpl(prefUrl(userId));
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`getPreferences failed ${res.status} ${txt}`);
  }
  return res.json();
}

/**
 * Set user notification preferences
 * @param {*} userId user identifier linked to preferences
 * @param {*} body a dictionary with the following keys:
 * notifyEmail(Bool), notifySlack(Bool), userEmail(String)
 * @returns a dictionary with ok(Bool) and preference(Dictionary) keys.
 * Preference is a dictionary with the updated values in the same format as getPreferences
 */
async function setPreferences(userId, body) {
  const res = await fetchImpl(prefUrl(userId), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`setPreferences failed ${res.status} ${txt}`);
  }
  return res.json();
}

/**
 * Send a basic notification
 * @param {*} userId user identifier linked to preferences
 * @param {*} param1 Dictionary with subject, message, and userEmail keys
 * @returns Status based on success
 */
async function dispatchNotification(userId, { subject, message, userEmail }) {
  const url = `${DEFAULT_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/dispatch/${encodeURIComponent(APP_ID)}`;
  const res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, userEmail, subject, message }) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`dispatchNotification failed ${res.status} ${txt}`);
  }
  return res.json();
}

/**
 * Send a notification with a template
 * @param {*} userId user identifier linked to preferences
 * @param {*} param1 Dictionary with event, context, role, subject, and userEmail keys
 * @returns Status based on success
 */
async function dispatchTemplated(userId, { event, context = {}, role, subject, userEmail }) {
  const url = `${DEFAULT_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/dispatch/${encodeURIComponent(APP_ID)}`;
  const payload = { userId, userEmail, event, context, ...(role ? { role } : {}), ...(subject ? { subject } : {}) };
  const res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`dispatchTemplated failed ${res.status} ${txt}`);
  }
  return res.json();
}

async function checkSlackStatus(email, userId) {
  const url = `${DEFAULT_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/preferences/${encodeURIComponent(APP_ID)}/${encodeURIComponent(userId)}/slack-status?email=${encodeURIComponent(email)}`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`checkSlackStatus failed ${res.status} ${txt}`);
  }
  return res.json();
}

module.exports = { getPreferences, setPreferences, dispatchNotification, dispatchTemplated, checkSlackStatus };
const DEFAULT_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4000';
if (process.env.NODE_ENV !== 'test') {
  // One-time debug log to aid diagnosing proxy target
  // eslint-disable-next-line no-console
  console.log(`[notifications-proxy] Using notification service at: ${DEFAULT_SERVICE_URL}`);
}
const APP_ID = process.env.NOTIFICATION_CLIENT_APP_ID || 'ta-portal';

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

function prefUrl(userId, appIdOverride) {
  const finalAppId = appIdOverride || APP_ID;
  return `${DEFAULT_SERVICE_URL}/api/notifications/preferences/${encodeURIComponent(finalAppId)}/${encodeURIComponent(userId)}`;
}

async function getPreferences(userId, appIdOverride) {
  const res = await fetchImpl(prefUrl(userId, appIdOverride));
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`getPreferences failed ${res.status} ${txt}`);
  }
  return res.json();
}

async function setPreferences(userId, body, appIdOverride) {
  const res = await fetchImpl(prefUrl(userId, appIdOverride), { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`setPreferences failed ${res.status} ${txt}`);
  }
  return res.json();
}

async function dispatchNotification(userId, { subject, message, userEmail }, appIdOverride) {
  const finalAppId = appIdOverride || APP_ID;
  const url = `${DEFAULT_SERVICE_URL}/api/notifications/dispatch/${encodeURIComponent(finalAppId)}`;
  const res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId, userEmail, subject, message }) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`dispatchNotification failed ${res.status} ${txt}`);
  }
  return res.json();
}

async function dispatchTemplated(userId, { event, context = {}, role, subject, userEmail }, appIdOverride) {
  const finalAppId = appIdOverride || APP_ID;
  const url = `${DEFAULT_SERVICE_URL}/api/notifications/dispatch/${encodeURIComponent(finalAppId)}`;
  const payload = { userId, userEmail, event, context, ...(role ? { role } : {}), ...(subject ? { subject } : {}) };
  const res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`dispatchTemplated failed ${res.status} ${txt}`);
  }
  return res.json();
}

async function checkSlackStatus(email, appIdOverride, userId) {
  const finalAppId = appIdOverride || APP_ID;
  const url = `${DEFAULT_SERVICE_URL}/api/notifications/preferences/${encodeURIComponent(finalAppId)}/${encodeURIComponent(userId)}/slack-status?email=${encodeURIComponent(email)}`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`checkSlackStatus failed ${res.status} ${txt}`);
  }
  return res.json();
}

module.exports = { getPreferences, setPreferences, dispatchNotification, dispatchTemplated, checkSlackStatus };
// Simple CommonJS notification client to be required by older CommonJS apps
const DEFAULT_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:4000';
const APP_ID = process.env.NOTIFICATION_CLIENT_APP_ID || 'ta-portal';

let fetchImpl;
try {
  fetchImpl = globalThis.fetch || require('node-fetch');
} catch (e) {
  // fallback to builtin http if node-fetch isn't available (very small implementation)
  const http = require('http');
  const https = require('https');
  fetchImpl = function(url, opts = {}) {
    return new Promise((resolve, reject) => {
      try {
        const u = new URL(url);
        const lib = u.protocol === 'https:' ? https : http;
        const body = opts.body;
        const headers = opts.headers || {};
        const req = lib.request(u, { method: opts.method || 'GET', headers }, (res) => {
          const chunks = [];
          res.on('data', (c) => chunks.push(c));
          res.on('end', () => {
            const text = Buffer.concat(chunks).toString('utf8');
            resolve({ ok: res.statusCode >= 200 && res.statusCode < 300, status: res.statusCode, text: async () => text, json: async () => JSON.parse(text) });
          });
        });
        req.on('error', reject);
        if (body) req.write(body);
        req.end();
      } catch (err) { reject(err); }
    });
  };
}

function buildUrl(identifier) {
  return `${DEFAULT_SERVICE_URL}/api/v1/preferences/${encodeURIComponent(APP_ID)}/${encodeURIComponent(identifier)}`;
}

async function getPreferences(identifier) {
  const url = buildUrl(identifier);
  const res = await fetchImpl(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`notification-client GET failed ${res.status} ${txt}`);
  }
  return res.json();
}

async function setPreferences(identifier, body) {
  const url = buildUrl(identifier);
  const res = await fetchImpl(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`notification-client PUT failed ${res.status} ${txt}`);
  }
  return res.json();
}

async function getRecent(identifier, opts = {}) {
  const { limit = 5, page = 0 } = opts || {};
  const url = `${DEFAULT_SERVICE_URL}/api/v1/recent/${encodeURIComponent(APP_ID)}/${encodeURIComponent(identifier)}?limit=${encodeURIComponent(limit)}&page=${encodeURIComponent(page)}`;
  const res = await fetchImpl(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`notification-client GET recent failed ${res.status} ${txt}`);
  }
  return res.json();
}

async function notifyEvent(event, context = {}, opts = {}) {
  // opts: { toEmails: [], toSlack: [], recipients: [] }
  const recipients = [];
  if (Array.isArray(opts.recipients) && opts.recipients.length) {
    recipients.push(...opts.recipients);
  } else {
    if (Array.isArray(opts.toEmails)) {
      for (const e of opts.toEmails) recipients.push({ email: e });
    }
    if (Array.isArray(opts.toSlack)) {
      for (const s of opts.toSlack) recipients.push({ slack: s });
    }
  }

  const url = (process.env.NOTIFICATION_SERVICE_URL || DEFAULT_SERVICE_URL) + '/send';
  const body = { event, context, recipients, appId: APP_ID };
  const res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text().catch(() => '<unreadable>');
    throw new Error(`notification-client POST /send failed ${res.status} ${txt}`);
  }
  return res.json();
}

module.exports = { getPreferences, setPreferences, getRecent, notifyEvent };


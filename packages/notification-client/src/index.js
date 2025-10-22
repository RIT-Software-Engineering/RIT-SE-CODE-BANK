import fetch from 'node-fetch';

const DEFAULT_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:4000';
const APP_ID = process.env.NOTIFICATION_CLIENT_APP_ID || 'ta-portal';

export async function getPreferences(identifier) {
  const url = `${DEFAULT_SERVICE_URL}/api/v1/preferences/${encodeURIComponent(APP_ID)}/${encodeURIComponent(identifier)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '<unreadable>');
    throw new Error(`Failed to get preferences: ${res.status} ${res.statusText} ${body}`);
  }
  return res.json();
}

export async function setPreferences(identifier, body) {
  const url = `${DEFAULT_SERVICE_URL}/api/v1/preferences/${encodeURIComponent(APP_ID)}/${encodeURIComponent(identifier)}`;
  const res = await fetch(url, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  if (!res.ok) {
    const text = await res.text().catch(() => '<unreadable>');
    throw new Error(`Failed to set preferences: ${res.status} ${res.statusText} ${text}`);
  }
  return res.json();
}

export async function getRecent(identifier, { limit = 5, page = 0 } = {}) {
  const url = `${DEFAULT_SERVICE_URL}/api/v1/recent/${encodeURIComponent(APP_ID)}/${encodeURIComponent(identifier)}?limit=${encodeURIComponent(limit)}&page=${encodeURIComponent(page)}`;
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text().catch(() => '<unreadable>');
    throw new Error(`Failed to get recent notifications: ${res.status} ${res.statusText} ${body}`);
  }
  return res.json();
}

export default { getPreferences, setPreferences, getRecent };

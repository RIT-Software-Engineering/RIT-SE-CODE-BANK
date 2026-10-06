
// backend/utils/notifications.js
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4001';
const NOTIFICATION_API_EXTENSION = process.env.NOTIFICATION_API_EXTENSION || '/notifications'
const APP_ID = process.env.NOTIFICATION_CLIENT_APP_ID || 'cmt';

/**
 * Get user notification preferences
 */
export async function getPreferences(userId, appIdOverride) {
  const appId = appIdOverride || APP_ID;
  const url = `${NOTIFICATION_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/preferences/${encodeURIComponent(appId)}/${encodeURIComponent(userId)}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`getPreferences failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Update user notification preferences
 */
export async function setPreferences(userId, body, appIdOverride) {
  const appId = appIdOverride || APP_ID;
  const url = `${NOTIFICATION_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/preferences/${encodeURIComponent(appId)}/${encodeURIComponent(userId)}`;
  
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  
  if (!res.ok) {
    throw new Error(`setPreferences failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Check if user is in Slack workspace
 */
export async function checkSlackStatus(email, appIdOverride, userId) {
  const appId = appIdOverride || APP_ID;
  const url = `${NOTIFICATION_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/preferences/${encodeURIComponent(appId)}/${encodeURIComponent(userId)}/slack-status?email=${encodeURIComponent(email)}`;
  
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`checkSlackStatus failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Send a simple notification
 */
export async function dispatchNotification(userId, { subject, message, userEmail }, appIdOverride) {
  const appId = appIdOverride || APP_ID;
  const url = `${NOTIFICATION_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/dispatch/${encodeURIComponent(appId)}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, userEmail, subject, message })
  });
  
  if (!res.ok) {
    throw new Error(`dispatchNotification failed: ${res.status}`);
  }
  return res.json();
}

/**
 * Send a templated notification
 */
export async function dispatchTemplated(userId, { event, context = {}, role, subject, userEmail }, appIdOverride) {
  const appId = appIdOverride || APP_ID;
  const url = `${NOTIFICATION_SERVICE_URL}${NOTIFICATION_API_EXTENSION}/dispatch/${encodeURIComponent(appId)}`;
  
  const payload = {
    userId,
    userEmail,
    event,
    context,
    ...(role ? { role } : {}),
    ...(subject ? { subject } : {})
  };
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  
  if (!res.ok) {
    throw new Error(`dispatchTemplated failed: ${res.status}`);
  }
  return res.json();
}
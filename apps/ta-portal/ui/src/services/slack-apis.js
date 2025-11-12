// ui/src/services/slack-apis.js

const BASE_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL + process.env.NEXT_PUBLIC_API_EXTENSION;
const SLACK_API_EXTENSION = process.env.NEXT_PUBLIC_SLACK_API_EXTENSION;

// Get the Slack OAuth URL
export async function getSlackOAuthURL(email = "") {
  if (!BASE_API_URL || !SLACK_API_EXTENSION) {
    throw new Error("Backend API URL is not configured.");
  }

  const url = new URL(`${BASE_API_URL}${SLACK_API_EXTENSION}/oauth-url`);
  if (email) {
    url.searchParams.append("state", email);
  }

  const response = await fetch(url.toString(), { credentials: 'include' });
  if (!response.ok) {
    throw new Error('Failed to get OAuth URL');
  }
  const data = await response.json();
  return data.url;
}

// Send a message to a Slack user
export async function sendMessageToSlack({ email, text }) {
  if (!BASE_API_URL || !SLACK_API_EXTENSION) {
    throw new Error("Backend API URL is not configured.");
  }

  const url = `${BASE_API_URL}${SLACK_API_EXTENSION}/send-message`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, text }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to send message');
  }
  return response.json();
}

// Get message history with a specific user
export async function getSlackMessageHistory({ email, limit = 50 }) {
  if (!BASE_API_URL || !SLACK_API_EXTENSION) {
    throw new Error("Backend API URL is not configured.");
  }

  const url = `${BASE_API_URL}${SLACK_API_EXTENSION}/message-history`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, limit }),
    credentials: 'include',
  });

  if (!response.ok) {
    throw new Error('Failed to fetch message history');
  }
  return response.json();
}

// Check if there's an active Slack session
export async function getSlackSession() {
  if (!BASE_API_URL || !SLACK_API_EXTENSION) {
    throw new Error("Backend API URL is not configured.");
  }
  const url = `${BASE_API_URL}${SLACK_API_EXTENSION}/session`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to check session');
  }
  return res.json();
}

// Logout and clear Slack cookies
export async function slackLogout() {
  if (!BASE_API_URL || !SLACK_API_EXTENSION) {
    throw new Error("Backend API URL is not configured.");
  }
  const url = `${BASE_API_URL}${SLACK_API_EXTENSION}/logout`;
  const res = await fetch(url, { method: 'POST', credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to logout');
  }
  return res.json();
}

// Get list of recent DM conversations
export async function getRecentDMs() {
  if (!BASE_API_URL || !SLACK_API_EXTENSION) {
    throw new Error("Backend API URL is not configured.");
  }
  const url = `${BASE_API_URL}${SLACK_API_EXTENSION}/recent-dms`;
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) {
    throw new Error('Failed to fetch recent DMs');
  }
  return res.json();
}
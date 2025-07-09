// ui/src/services/slack-apis.js

const BASE_API_URL = process.env.NEXT_PUBLIC_BASE_API_URL;
const SLACK_API_EXTENSION = process.env.NEXT_PUBLIC_SLACK_API_EXTENSION;

// Basic error handler for API responses
async function handleApiResponse(response) {
  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: 'Unknown error' }));
    const errorMessage = errorBody.error || errorBody.message || `HTTP error! status: ${response.status}`;
    throw new Error(errorMessage);
  }
  return response.json();
}

// Fetches the OAuth URL for Slack
export async function getSlackOAuthURL() {
  if (!BASE_API_URL || !SLACK_API_EXTENSION) {
    throw new Error("Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_SLACK_API_EXTENSION) are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${SLACK_API_EXTENSION}/oauth-url`;
  console.log(`Fetching from: ${url}`);

  const response = await fetch(url);

  const data = await handleApiResponse(response);
  return data.url;
}

// Sends a message to a user on Slack via the backend
export async function sendMessageToSlack({ token, email, text, teamId }) {
  if (!BASE_API_URL || !SLACK_API_EXTENSION) {
    throw new Error("Backend API URL components (NEXT_PUBLIC_BASE_API_URL, NEXT_PUBLIC_SLACK_API_EXTENSION) are not defined. Check your .env.local file.");
  }

  const url = `${BASE_API_URL}${SLACK_API_EXTENSION}/send-message`;
  console.log(`Posting to: ${url}`);

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ token, email, text, teamId }),
  });

  return handleApiResponse(response);
}
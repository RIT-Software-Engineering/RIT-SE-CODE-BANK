// ui/src/services/slack-apis.js

const BASE_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL + process.env.NEXT_PUBLIC_API_EXTENSION;
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

/**
 * Fetches the OAuth URL for Slack from the backend.
 * @param {string} [email] - Optional email to pass through the OAuth flow as state.
 * @returns {Promise<string>} The full Slack authorization URL.
 */
export async function getSlackOAuthURL(email = "") {
  if (!BASE_API_URL || !SLACK_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  // Use URL to safely construct the path with an optional query parameter.
  const url = new URL(`${BASE_API_URL}${SLACK_API_EXTENSION}/oauth-url`);
  if (email) {
    url.searchParams.append("state", email); // Use 'state' as the parameter name
  }

  console.log(`Fetching from: ${url.toString()}`);

  const response = await fetch(url.toString());
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
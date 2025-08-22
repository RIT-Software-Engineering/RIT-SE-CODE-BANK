// ui/src/services/slack-apis.js

// --- API Configuration ---
const BASE_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL + process.env.NEXT_PUBLIC_API_EXTENSION;
const SLACK_API_EXTENSION = process.env.NEXT_PUBLIC_SLACK_API_EXTENSION;

/**
 * A centralized handler for processing API fetch responses.
 * It checks for successful responses and parses the JSON body.
 * For failed responses, it attempts to parse an error message from the body.
 * @param {Response} response - The raw Response object from a fetch call.
 * @returns {Promise<any>} A promise that resolves to the JSON body of the response.
 * @throws {Error} Throws an error with a message from the API or a generic status error.
 */
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
 * This URL is used to initiate the Slack authentication flow for a user.
 * @param {string} [email] - Optional email to pass through the OAuth flow via the 'state' parameter,
 * which can be used to pre-fill information or track the user upon return.
 * @returns {Promise<string>} A promise that resolves to the full Slack authorization URL.
 */
export async function getSlackOAuthURL(email = "") {
  if (!BASE_API_URL || !SLACK_API_EXTENSION) {
    throw new Error(
      "Backend API URL components are not defined. Check your .env.local file."
    );
  }

  // Use the URL constructor to safely construct the path with an optional query parameter.
  const url = new URL(`${BASE_API_URL}${SLACK_API_EXTENSION}/oauth-url`);
  if (email) {
    // The 'state' parameter is a standard OAuth 2.0 feature used to maintain state between the request and callback.
    url.searchParams.append("state", email);
  }

  console.log(`Fetching from: ${url.toString()}`);

  const response = await fetch(url.toString());
  const data = await handleApiResponse(response);
  return data.url;
}

/**
 * Sends a direct message to a Slack user via the backend service.
 * The backend uses this data to find the user by email and send them a message.
 * @param {object} messageData - An object containing the message details.
 * @param {string} messageData.token - The Slack OAuth token for authentication.
 * @param {string} messageData.email - The email of the Slack user to receive the message.
 * @param {string} messageData.text - The content of the message to be sent.
 * @param {string} messageData.teamId - The ID of the Slack workspace (team).
 * @returns {Promise<object>} A promise that resolves to the server's response, typically a confirmation from the Slack API.
 */
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
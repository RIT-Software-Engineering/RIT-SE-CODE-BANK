import axios from "axios";

const token = process.env.SLACK_BOT_TOKEN;

/**
 * Generates headers for Slack API requests.
 * 
 * @returns {Object} Headers with bearer token and content type
 * @throws {Error} If SLACK_BOT_TOKEN not configured
 */
function headers() {
  if (!token) throw new Error("SLACK_BOT_TOKEN not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
  };
}

/**
 * Resolves a Slack DM channel ID by email.
 * If a username is provided instead, converts it to email by appending @rit.edu.
 * 
 * @param {Object} params - Resolution parameters
 * @param {string} params.slack - Slack username with @ prefix (e.g., "@jdoe") - will be converted to email
 * @param {string} params.email - Email address for user lookup
 * @returns {Promise<string>} Slack channel ID for DM
 * @throws {Error} If user not found or Slack API fails
 */
export async function resolveDmChannel({ slack, email }) {
  // Convert username to email if provided (RIT Slack uses email-based usernames)
  let lookupEmail = email;
  if (!lookupEmail && slack && slack.startsWith("@")) {
    const username = slack.slice(1);
    lookupEmail = `${username}@rit.edu`;
  }

  if (!lookupEmail) {
    throw new Error("No email or username provided for Slack lookup");
  }

  // Use email lookup API
  const resp = await axios.get(
    "https://slack.com/api/users.lookupByEmail",
    { headers: headers(), params: { email: lookupEmail } }
  );
  if (!resp.data?.ok) {
    throw new Error(`users.lookupByEmail failed for ${lookupEmail}: ${resp.data?.error || 'unknown error'}`);
  }
  
  const userId = resp.data.user.id;
  const open = await axios.post(
    "https://slack.com/api/conversations.open",
    { users: userId },
    { headers: headers() }
  );
  if (!open.data?.ok) {
    throw new Error(`conversations.open failed: ${open.data?.error || 'unknown error'}`);
  }
  
  return open.data.channel.id;
}

/**
 * Sends a message to a Slack channel or DM.
 * 
 * @param {Object} params - Message parameters
 * @param {string} params.channel - Slack channel ID
 * @param {string} params.text - Message text content
 * @param {Array} params.blocks - Optional Slack block kit blocks
 * @returns {Promise<Object>} Slack API response with message timestamp
 * @throws {Error} If message fails to send
 */
export async function sendSlackMessage({ channel, text, blocks }) {
  const payload = { channel, text };
  if (blocks) payload.blocks = blocks;
  const resp = await axios.post(
    "https://slack.com/api/chat.postMessage",
    payload,
    { headers: headers() }
  );
  if (!resp.data?.ok) {
    throw new Error(`chat.postMessage failed: ${resp.data?.error}`);
  }
  return resp.data;
}

// Exports for testing
export { headers };

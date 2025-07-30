// server/server/routing/slack_routes.js

// =============================================================================
// SETUP & IMPORTS
// =============================================================================

const axios = require('axios');
const router = require('express').Router();

// =============================================================================
// SLACK OAUTH & MESSAGING ROUTES
// =============================================================================

/**
 * @route   GET /api/slack/oauth-url
 * @desc    Constructs and provides the Slack OAuth URL for the frontend.
 * The frontend calls this endpoint to get the URL that users click to
 * initiate the Slack authorization process.
 * @access  Public
 * @returns {JSON} An object containing the full Slack authorization URL.
 */
router.get('/oauth-url', (req, res) => {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.SLACK_REDIRECT_URI);
    // Define the permissions your app is requesting.
    const scope = encodeURIComponent('users:read.email,chat:write,im:write,users:read');
    // Construct the final URL with all necessary parameters.
    const oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=${scope}&redirect_uri=${redirectUri}`;
    
    res.json({ url: oauthUrl });
});


/**
 * @route   GET /api/slack/oauth_redirect
 * @desc    Handles the redirect from Slack after a user authorizes the app.
 * It receives a temporary authorization 'code', exchanges it for a
 * permanent user access token, and then redirects the user back to the
 * frontend with the token.
 * @access  Public
 * @query   {string} code - The temporary authorization code from Slack.
 * @query   {string} [error] - An error message if the user denies authorization.
 */
router.get('/oauth_redirect', async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL;

  // If the user denied the request or an error occurred, Slack sends no code.
  if (!code) {
    const errorMessage = 'Authorization denied or failed.';
    return res.redirect(`${frontendUrl}/Messaging?error=${encodeURIComponent(errorMessage)}`);
  }

  try {
    // Exchange the temporary code for a user access token by calling Slack's API.
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI,
      },
    });

    // Handle cases where the Slack API returns an error (e.g., invalid code).
    if (!response.data.ok) {
      console.error('Slack OAuth Error:', response.data.error);
      const errorMessage = `OAuth failed: ${response.data.error}`;
      return res.redirect(`${frontendUrl}/Messaging?error=${encodeURIComponent(errorMessage)}`);
    }

    // Extract the user token and team ID from the successful response.
    const userToken = response.data.authed_user.access_token;
    const teamId = response.data.team.id;

    // Redirect the user back to the frontend, passing the token and teamId as query parameters.
    res.redirect(`${frontendUrl}/Messaging?token=${userToken}&teamId=${teamId}`);

  } catch (error) {
    // Handle unexpected server errors during the API call.
    console.error('Error during OAuth token exchange:', error.message);
    const errorMessage = 'An internal error occurred during the OAuth process.';
    res.redirect(`${frontendUrl}/Messaging?error=${encodeURIComponent(errorMessage)}`);
  }
});


/**
 * @route   POST /api/slack/send-message
 * @desc    Sends a direct message to a Slack user on behalf of the authenticated user.
 * @access  Public
 * @body    {string} token - The authenticated user's Slack access token.
 * @body    {string} text - The content of the message to be sent.
 * @body    {string} email - The email address of the message recipient.
 * @body    {string} teamId - The Slack team ID (workspace).
 * @returns {JSON} A success or error message.
 */
router.post('/send-message', async (req, res) => {
  const { token, text, email, teamId } = req.body;

  // Validate that all required data is present in the request body.
  if (!token || !text || !email || !teamId) {
    return res.status(400).json({ success: false, message: 'Missing required form data.' });
  }

  try {
    // Step 1: Look up the recipient's Slack user ID using their email address.
    const userLookupRes = await axios.get('https://slack.com/api/users.lookupByEmail', {
      headers: { Authorization: `Bearer ${token}` },
      params: { email }
    });

    // Handle cases where the user lookup fails (e.g., email not found in the workspace).
    if (!userLookupRes.data.ok) {
        return res.status(404).json({ success: false, message: `User lookup failed: ${userLookupRes.data.error}. Is the email correct?` });
    }
    const recipientUserId = userLookupRes.data.user.id;

    // Step 2: Open a direct message (DM) channel with the recipient.
    // This is necessary to get the channel ID required for sending a message.
    const openRes = await axios.post('https://slack.com/api/conversations.open',
      { users: recipientUserId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Handle failure to open a DM channel.
    if (!openRes.data.ok) {
      return res.status(500).json({ success: false, message: `Failed to open DM channel: ${openRes.data.error}` });
    }
    const channelId = openRes.data.channel.id;

    // Step 3: Post the message to the opened DM channel.
    const postResult = await axios.post('https://slack.com/api/chat.postMessage', {
        channel: channelId,
        text,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    // Handle failure to post the message.
    if (!postResult.data.ok) {
        return res.status(500).json({ success: false, message: `Failed to post message: ${postResult.data.error}`});
    }

    // If all steps are successful, return a success response to the client.
    res.json({
        success: true,
        message: `Message sent successfully to ${email}!`
    });

  } catch (error) {
    // Catch any unexpected server errors during the process.
    console.error('Error sending message:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: 'An internal error occurred while sending the message.' });
  }
});

// =============================================================================
// EXPORTS
// =============================================================================

module.exports = router;
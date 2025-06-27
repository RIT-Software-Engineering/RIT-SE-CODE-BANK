
const router = require('express').Router();

/**
 * Route 1: Get OAuth URL
 * The frontend will call this to get the dynamic Slack authorization URL.
 */
router.get('/api/oauth-url', (req, res) => {
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.SLACK_REDIRECT_URI);
    const scope = encodeURIComponent('users:read.email,chat:write,im:write,users:read');
    const oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=${scope}&redirect_uri=${redirectUri}`;
    res.json({ url: oauthUrl });
});


/**
 * Route 2: Slack OAuth Redirect Handler
 * Slack redirects here after user authorization. It exchanges the code for a token.
 */
router.get('/slack/oauth_redirect', async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.status(400).send('Error: Missing authorization code from Slack.');
  }

  try {
    const response = await axios.post('https://slack.com/api/oauth.v2.access', null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI,
      },
    });

    if (!response.data.ok) {
      console.error('OAuth Error:', response.data.error);
      return res.redirect('/?error=' + encodeURIComponent('OAuth failed: ' + response.data.error));
    }

    const userToken = response.data.authed_user.access_token;
    const teamId = response.data.team.id;

    // Redirect back to the main page with token and teamId in the query string.
    // The frontend will grab these and store them.
    res.redirect(`/?token=${userToken}&teamId=${teamId}`);

  } catch (error) {
    console.error('Error during OAuth:', error);
    res.redirect('/?error=' + encodeURIComponent('Error during OAuth process.'));
  }
});


/**
 * Route 3: Send Message Handler
 * The frontend form will submit to this API endpoint.
 */
router.post('/api/send-message', async (req, res) => {
  const { token, text, email, teamId } = req.body;

  if (!token || !text || !email || !teamId) {
    return res.status(400).json({ success: false, message: 'Missing required form data.' });
  }

  try {
    // Step 1: Find user ID from their email
    const userLookupRes = await axios.get('https://slack.com/api/users.lookupByEmail', {
      headers: { Authorization: `Bearer ${token}` },
      params: { email }
    });

    if (!userLookupRes.data.ok) {
        return res.status(404).json({ success: false, message: `User lookup failed: ${userLookupRes.data.error}. Is the email correct?` });
    }
    const recipientUserId = userLookupRes.data.user.id;

    // Step 2: Open a direct message channel
    const openRes = await axios.post('https://slack.com/api/conversations.open',
      { users: recipientUserId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!openRes.data.ok) {
      return res.status(500).json({ success: false, message: 'Failed to open DM channel: ' + openRes.data.error });
    }
    const channelId = openRes.data.channel.id;

    // Step 3: Post the message
    const postResult = await axios.post('https://slack.com/api/chat.postMessage', {
        channel: channelId,
        text,
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!postResult.data.ok) {
        return res.status(500).json({ success: false, message: `Failed to post message: ${postResult.data.error}`});
    }

    // Success! Respond with a success message and the deep link for the frontend to use.
    const deepLink = `slack://channel?team=${teamId}&id=${channelId}`;
    res.json({
        success: true,
        message: `Message sent successfully to ${email}!`,
        deepLink: deepLink
    });

  } catch (error) {
    console.error('Error sending message:', error.response ? error.response.data : error.message);
    res.status(500).json({ success: false, message: 'An internal error occurred while sending the message.' });
  }
});


module.exports = router;
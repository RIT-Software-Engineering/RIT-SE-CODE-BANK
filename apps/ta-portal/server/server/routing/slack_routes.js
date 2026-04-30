// server/server/routing/slack_routes.js

const axios = require('axios');
const router = require('express').Router();

router.get('/oauth-url', (req, res) => {
    const { state } = req.query;
    const clientId = process.env.SLACK_CLIENT_ID;
    const redirectUri = encodeURIComponent(process.env.SLACK_REDIRECT_URI);
    const scope = encodeURIComponent('users:read.email,chat:write,im:write,users:read,im:history,im:read');
    const oauthUrl = `https://slack.com/oauth/v2/authorize?client_id=${clientId}&user_scope=${scope}&redirect_uri=${redirectUri}&state=${
      state || ""
    }`;
    
    res.json({ url: oauthUrl });
});

router.get('/oauth_redirect', async (req, res) => {
  const { code, state, error } = req.query; 
  const frontendUrl = process.env.FRONTEND_URL;

  const email = state ? decodeURIComponent(state) : null;

  // Redirect with email or without depending on context
  const baseRedirectUrl = email
    ? `${frontendUrl}/Messaging/${encodeURIComponent(email)}`
    : `${frontendUrl}/Messaging`;

  if (error || !code) {
    const err = error || "Authorization denied or failed.";
    return res.redirect(`${baseRedirectUrl}?error=${encodeURIComponent(err)}`);
  }

  try {
    const response = await axios.post("https://slack.com/api/oauth.v2.access", null, {
      params: {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code,
        redirect_uri: process.env.SLACK_REDIRECT_URI,
      },
    });

    if (!response.data.ok) {
      const err = `OAuth failed: ${response.data.error}`;
      return res.redirect(`${baseRedirectUrl}?error=${encodeURIComponent(err)}`);
    }

    const userToken = response.data.authed_user.access_token;
    const teamId = response.data.team.id;

    // Set secure cookies based on environment
    const isProd = process.env.NODE_ENV === 'production';
    const isSecure = isProd || req.secure === true || (req.headers['x-forwarded-proto'] === 'https');
    const sameSite = isSecure ? 'none' : 'lax';
    const cookieOpts = {
      httpOnly: true,
      secure: isSecure,
      sameSite,
      path: '/',
      maxAge: 30 * 24 * 60 * 60 * 1000,
    };

    res.cookie('slack_token', userToken, cookieOpts);
    res.cookie('slack_team_id', teamId, { ...cookieOpts, httpOnly: true });

    res.redirect(baseRedirectUrl);
  } catch (err) {
    const msg = "An internal error occurred during OAuth.";
    res.redirect(`${baseRedirectUrl}?error=${encodeURIComponent(msg)}`);
  }
});


router.post('/send-message', async (req, res) => {
  const { token: bodyToken, text, email, teamId: bodyTeamId } = req.body;
  // Try cookies first, fall back to body for backward compat
  const token = req.cookies?.slack_token || bodyToken;
  const teamId = req.cookies?.slack_team_id || bodyTeamId;

  if (!token || !text || !email || !teamId) {
    return res.status(400).json({ success: false, message: 'Missing required data.' });
  }

  try {
    // Look up the recipient's Slack ID by email
    const userLookupRes = await axios.get('https://slack.com/api/users.lookupByEmail', {
      headers: { Authorization: `Bearer ${token}` },
      params: { email }
    });

    if (!userLookupRes.data.ok) {
      return res.status(404).json({ 
        success: false, 
        message: `User lookup failed: ${userLookupRes.data.error}. Is the email correct?` 
      });
    }
    const recipientUserId = userLookupRes.data.user.id;

    // Open a DM channel with the recipient
    const openRes = await axios.post('https://slack.com/api/conversations.open',
      { users: recipientUserId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!openRes.data.ok) {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to open DM channel: ${openRes.data.error}` 
      });
    }
    const channelId = openRes.data.channel.id;

    // Send the message
    const postResult = await axios.post('https://slack.com/api/chat.postMessage', {
      channel: channelId,
      text,
    },
    { headers: { Authorization: `Bearer ${token}` } });

    if (!postResult.data.ok) {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to post message: ${postResult.data.error}` 
      });
    }

    res.json({ success: true, message: `Message sent successfully to ${email}!` });
  } catch (error) {
    console.error('Error sending message:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while sending the message.' 
    });
  }
});


router.post('/message-history', async (req, res) => {
  const { token: bodyToken, email, limit = 50 } = req.body;
  const token = req.cookies?.slack_token || bodyToken;

  if (!token || !email) {
    return res.status(400).json({ success: false, message: 'Missing token or email.' });
  }

  try {
    // Look up the recipient by email
    const userLookupRes = await axios.get('https://slack.com/api/users.lookupByEmail', {
      headers: { Authorization: `Bearer ${token}` },
      params: { email }
    });

    if (!userLookupRes.data.ok) {
      return res.status(404).json({ 
        success: false, 
        message: `User lookup failed: ${userLookupRes.data.error}. Is the email correct?`,
        messages: []
      });
    }
    const recipientUserId = userLookupRes.data.user.id;

    // Open DM with recipient
    const openRes = await axios.post('https://slack.com/api/conversations.open',
      { users: recipientUserId },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (!openRes.data.ok) {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to open DM channel: ${openRes.data.error}`,
        messages: []
      });
    }
    const channelId = openRes.data.channel.id;

    // Fetch conversation history
    const historyRes = await axios.get('https://slack.com/api/conversations.history', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        channel: channelId,
        limit: Math.min(limit, 100), // API max is 100
      }
    });

    if (!historyRes.data.ok) {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to retrieve message history: ${historyRes.data.error}`,
        messages: []
      });
    }

    // Get current user to mark own messages
    const authUserRes = await axios.get('https://slack.com/api/auth.test', {
      headers: { Authorization: `Bearer ${token}` }
    });
    const currentUserId = authUserRes.data.ok ? authUserRes.data.user_id : null;

    // Batch fetch user display names
    const uniqueUserIds = [...new Set(historyRes.data.messages.map(m => m.user).filter(Boolean))];
    const userInfoMap = {};
    
    await Promise.all(
      uniqueUserIds.map(async (userId) => {
        try {
          const userInfoRes = await axios.get('https://slack.com/api/users.info', {
            headers: { Authorization: `Bearer ${token}` },
            params: { user: userId }
          });
          if (userInfoRes.data.ok) {
            const profile = userInfoRes.data.user.profile;
            userInfoMap[userId] = profile.display_name || profile.real_name || profile.name || 'Slack User';
          }
        } catch (e) {
          console.error(`Failed to fetch user info for ${userId}:`, e.message);
        }
      })
    );

    // Enrich messages with user names and metadata
    const enrichedMessages = historyRes.data.messages.map(msg => ({
      ...msg,
      isMe: msg.user === currentUserId,
      user_name: msg.user === currentUserId ? 'You' : (userInfoMap[msg.user] || msg.username || 'Slack User'),
    }));

    res.json({
      success: true,
      messages: enrichedMessages,
      total: enrichedMessages.length,
    });

  } catch (error) {
    console.error('Error fetching message history:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while fetching message history.',
      messages: []
    });
  }
});

/**
 * GET /ta-portal-api/slack/session
 * Check if user has an active Slack session
 */
router.get('/session', (req, res) => {
  const token = req.cookies?.slack_token;
  const teamId = req.cookies?.slack_team_id;
  res.json({ connected: Boolean(token), teamId: teamId || null });
});

/**
 * GET /ta-portal-api/slack/recent-dms
 * Get list of recent DM conversations (excludes bots)
 */
router.get('/recent-dms', async (req, res) => {
  const token = req.cookies?.slack_token;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing Slack token.' });
  }

  try {
    // Get recent IM conversations
    const convsRes = await axios.get('https://slack.com/api/conversations.list', {
      headers: { Authorization: `Bearer ${token}` },
      params: {
        types: 'im',
        limit: 20,
        exclude_archived: true,
      }
    });

    if (!convsRes.data.ok) {
      return res.status(500).json({ 
        success: false, 
        message: `Failed to fetch conversations: ${convsRes.data.error}`,
        channels: []
      });
    }

    const conversations = convsRes.data.channels;

    // Fetch user details for each conversation
    const enrichedConvs = await Promise.all(
      conversations.map(async (conv) => {
        try {
          const userRes = await axios.get('https://slack.com/api/users.info', {
            headers: { Authorization: `Bearer ${token}` },
            params: { user: conv.user }
          });
          
          if (userRes.data.ok) {
            const profile = userRes.data.user.profile;
            const email = profile.email || null;
            const isBot = userRes.data.user.is_bot || false;
            
            // Skip bots and users without email
            if (isBot || !email) {
              return null;
            }
            
            return {
              id: conv.id,
              user_id: conv.user,
              name: profile.display_name || profile.real_name || profile.name || 'Unknown',
              email: email,
              unread_count: conv.unread_count || 0,
            };
          }
        } catch (e) {
          console.error(`Failed to fetch user info for ${conv.user}:`, e.message);
        }
        return null;
      })
    );

    // Filter out nulls (bots, no email)
    const filteredConvs = enrichedConvs.filter(conv => conv !== null);

    res.json({
      success: true,
      conversations: filteredConvs,
      total: filteredConvs.length,
    });

  } catch (error) {
    console.error('Error fetching recent DMs:', error.response?.data || error.message);
    res.status(500).json({ 
      success: false, 
      message: 'An error occurred while fetching DMs.',
      channels: []
    });
  }
});

/**
 * POST /ta-portal-api/slack/logout
 * Clear Slack auth cookies
 */
router.post('/logout', (req, res) => {
  const isProd = process.env.NODE_ENV === 'production';
  const isSecure = isProd || req.secure === true || (req.headers['x-forwarded-proto'] === 'https');
  const sameSite = isSecure ? 'none' : 'lax';
  
  const clearOpts = { 
    path: '/',
    httpOnly: true,
    secure: isSecure,
    sameSite,
  };
  
  res.clearCookie('slack_token', clearOpts);
  res.clearCookie('slack_team_id', clearOpts);
  res.json({ success: true });
});

module.exports = router;
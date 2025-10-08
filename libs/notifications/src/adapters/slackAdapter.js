// slackAdapter.js
const axios = require('axios');

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;
console.log(SLACK_BOT_TOKEN);
async function sendSlackDMByEmail(email, text) {
  try {
    // Step 1: Lookup Slack user ID by email
    const lookup = await axios.get('https://slack.com/api/users.lookupByEmail', {
      headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` },
      params: { email },
    });
    if (!lookup.data.ok) throw new Error(`Lookup failed: ${lookup.data.error}`);
    const userId = lookup.data.user.id;

    // Step 2: Open IM channel
    const open = await axios.post(
      'https://slack.com/api/conversations.open',
      { users: userId },
      { headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` } }
    );
    if (!open.data.ok) throw new Error(`Open failed: ${open.data.error}`);
    const channel = open.data.channel.id;

    // Step 3: Send message
    const post = await axios.post(
      'https://slack.com/api/chat.postMessage',
      { channel, text },
      { headers: { Authorization: `Bearer ${SLACK_BOT_TOKEN}` } }
    );
    if (!post.data.ok) throw new Error(`Post failed: ${post.data.error}`);

    return { success: true };
  } catch (err) {
    console.error('Slack DM error:', err.message);
    return { success: false, error: err.message };
  }
}

module.exports = { sendSlackDMByEmail };

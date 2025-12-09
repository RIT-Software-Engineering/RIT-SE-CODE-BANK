import axios from "axios";

const token = process.env.SLACK_BOT_TOKEN;

function headers() {
  if (!token) throw new Error("SLACK_BOT_TOKEN not set");
  return {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json; charset=utf-8",
  };
}

// Helper: Resolve a channel ID for DM by email or username.
// Usage:
//   - pass { slack: "C123..." } to send to a channel by ID
//   - pass { slack: "@username" } to DM by handle
//   - or pass { email: "user@rit.edu" } to DM by email via lookup
export async function resolveDmChannel({ slack, email }) {
  // If a channel ID is provided, use it
  if (slack && (slack.startsWith?.("C") || slack.startsWith?.("D"))) {
    return slack;
  }

  // If a Slack handle like @user is provided, lookup by username -> user id
  if (slack && slack.startsWith("@")) {
    // Slack doesn't provide a direct username->userId endpoint reliably.
    // Best practice: resolve by email when possible.
    // Here we try users.list (can be expensive); consider caching in prod.
    const list = await axios.get("https://slack.com/api/users.list", {
      headers: headers(),
    });
    if (!list.data?.ok) throw new Error("Slack users.list failed");
    const handle = slack.slice(1);
    const user = list.data.members.find((m) => m.name === handle);
    if (!user) throw new Error(`Slack user @${handle} not found`);
    const open = await axios.post(
      "https://slack.com/api/conversations.open",
      { users: user.id },
      { headers: headers() }
    );
    if (!open.data?.ok) throw new Error("conversations.open failed");
    return open.data.channel.id;
  }

  // Resolve by email
  if (email) {
    const resp = await axios.get(
      "https://slack.com/api/users.lookupByEmail",
      { headers: headers(), params: { email } }
    );
    if (!resp.data?.ok) throw new Error(`users.lookupByEmail failed for ${email}`);
    const userId = resp.data.user.id;
    const open = await axios.post(
      "https://slack.com/api/conversations.open",
      { users: userId },
      { headers: headers() }
    );
    if (!open.data?.ok) throw new Error("conversations.open failed");
    return open.data.channel.id;
  }

  throw new Error("No Slack destination resolvable");
}

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

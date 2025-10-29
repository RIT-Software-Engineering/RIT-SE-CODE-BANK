import axios from 'axios';

// Resolve a user's email from an authoritative source for a given appId/userId.
// For ta-portal, we call the TA-Portal backend user endpoint.
export async function resolveUserEmail({ appId, userId }) {
  if (!appId || !userId) return null;
  try {
    if (appId === 'ta-portal') {
      const base = process.env.TAPORTAL_API_URL || 'http://127.0.0.1:3300';
      const url = `${base.replace(/\/$/, '')}/api/db/user/${encodeURIComponent(userId)}`;
      const resp = await axios.get(url, { validateStatus: () => true });
      if (resp.status === 200 && resp.data && resp.data.email) {
        return String(resp.data.email).trim().toLowerCase();
      }
    }
  } catch (e) {
    // swallow and return null; dispatch can proceed with other channels
  }
  return null;
}

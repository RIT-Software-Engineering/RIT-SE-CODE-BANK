let fetchImpl;
try {
  fetchImpl = globalThis.fetch || require('node-fetch');
} catch (_) {
  fetchImpl = require('node:https').request; // fallback not expected
}

(async () => {
  const base = process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4000';
  const appId = process.env.APP_ID || 'ta-portal';
  const userId = process.env.USER_ID || 'bgg6007';
  const url = `${base}/api/notifications/dispatch/${encodeURIComponent(appId)}`;
  const body = {
    userId,
    event: 'application_status_changed',
    role: 'candidate',
    context: {
      appName: 'TA Portal',
      recipient: { name: 'Ben Griffin' },
      item: { title: 'Graduate TA - SE' },
      status: { new: 'Under Review' },
      cta: { url: 'https://ta.se.rit.edu/applications/1234' }
    }
  };
  const res = await fetchImpl(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  console.log('Status', res.status);
  console.log(await res.text());
})();

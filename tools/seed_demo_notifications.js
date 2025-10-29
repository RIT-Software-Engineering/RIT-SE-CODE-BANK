// Simple seed script to POST demo notifications directly to the notification service
// Usage: node tools/seed_demo_notifications.js <username> <email>
const DEFAULT_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:4000';
const APP_ID = process.env.NOTIFICATION_CLIENT_APP_ID || 'ta-portal';
const fetch = (globalThis.fetch) || require('node-fetch');

const username = process.argv[2] || 'demo_user';
const email = process.argv[3] || 'demo@example.com';

async function main() {
  try {
    console.log('Sending demo notifications for', username, email);
    const events = [
      { event: 'APPLICATION_RECEIVED', context: { candidateName: username, courseName: 'CS 101' } },
      { event: 'STATUS_CHANGED', context: { candidateName: username, new_status: 'interview' } },
      { event: 'HIRED', context: { candidateName: username, courseName: 'CS 101' } },
    ];

    for (const e of events) {
      try {
        const url = `${DEFAULT_SERVICE_URL}/api/notifications/dispatch/${encodeURIComponent(APP_ID)}`;
        const body = { userId: username, event: e.event, context: { ...e.context, candidateEmail: email }, role: 'candidate' };
        const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        const data = await res.json().catch(() => ({}));
        console.log('Sent', e.event, '=>', res.ok ? 'ok' : `${res.status}`, data);
      } catch (err) {
        console.error('Failed to send', e.event, err && err.message);
      }
    }

    console.log('Done');
  } catch (err) {
    console.error('Seed failed', err && err.stack);
    process.exit(1);
  }
}

main();

// Simple seed script to POST demo notifications via packages/notification-client
// Usage: node tools/seed_demo_notifications.js <username> <email>
const client = require('../packages/notification-client/index.cjs');

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
        const res = await client.notifyEvent(e.event, e.context, { toEmails: [email] });
        console.log('Sent', e.event, '=>', res && res.ok ? 'ok' : JSON.stringify(res));
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

// index.js
const templates = require('./templates');
const { sendSlackDMByEmail } = require('./slackAdapter');

async function notifyEvent(eventType, payload, options = {}) {
  const { toEmails, send } = options;

  const render = templates[eventType];
  if (!render) return;

  const text = render(payload);
  const uniqueEmails = [...new Set((toEmails || []).filter(Boolean))];
  if (!uniqueEmails.length) return;

  // always default send → sendSlackDMByEmail
  const sendFn = send || sendSlackDMByEmail;

  const results = await Promise.allSettled(uniqueEmails.map(e => sendFn(e, text)));
  const failures = results.filter(r => r.status === 'rejected' || (r.value && r.value.success === false));
  if (failures.length) {
    console.error('Notifications: some Slack DMs failed', { eventType, failures: failures.length });
  }

  failures.forEach((failure, index) => {
    console.error(`Notification failure #${index + 1}:`, failure.status === 'rejected' ? failure.reason : failure.value.error);
  })
}

module.exports = { notifyEvent, templates };

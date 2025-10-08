// index.js
const templates = require("./templates/slackTemplates");
const { sendSlackDMByEmail } = require("./adapters/slackAdapter");
const { sendEmailByAddress } = require("./adapters/emailAdapter");

async function notifyEvent(eventType, payload, options = {}) {
  const { toEmails, sendSlack = true, sendEmail = true } = options;

  const render = templates[eventType];
  if (!render) return;

  const text = render(payload);
  const uniqueEmails = [...new Set((toEmails || []).filter(Boolean))];
  if (!uniqueEmails.length) return;

  const tasks = [];

  if (sendSlack) {
    tasks.push(...uniqueEmails.map((e) => sendSlackDMByEmail(e, text)));
  }

  if (sendEmail) {
    tasks.push(...uniqueEmails.map((e) => sendEmailByAddress(e, text)));
  }

  const results = await Promise.allSettled(tasks);
  const failures = results.filter((r) => r.status === "rejected" || (r.value && !r.value.success));
  if (failures.length) {
    console.error('Notifications: some sends failed', { eventType, failures: failures.length });
  }
}
  
module.exports = { notifyEvent, templates };

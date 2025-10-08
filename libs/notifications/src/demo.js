// demo.js
require('dotenv').config();

const { notifyEvent } = require('./index');

// Mock event payload
const demoPayload = {
  applicantName: 'Ben Griffin',
  courseCode: 'SWEN-261',
  courseName: 'Intro to Software Engineering',
  instructorName: 'Kenn Martinez',
};

// Main entry
async function main() {
  await notifyEvent('HIRED', demoPayload, {
    toEmails: ['bgg6007@rit.edu'],
    sendSlack: true,
    sendEmail: true,
  });

  console.log('✅ Demo complete – check Slack and smtp4dev inbox.');
}

main().catch(err => console.error('❌ Demo error:', err));

const fetch = require('node-fetch');
(async () => {
  const url = process.env.NOTIFICATION_SERVICE_URL || 'http://127.0.0.1:4000/send';
  const body = {
    event: 'APPLICATION_RECEIVED',
    context: {
      candidateName: 'Ben Griffin',
      courseCode: 'SWEN-261',
      courseName: 'Introduction to Software Engineering',
      instructorName: 'Dr. Jane Doe',
      instructorEmail: 'faculty2@example.com',
      comment: 'Candidate submitted application.'
    },
    recipients: [ { role: 'candidate', email: 'bgg6007@rit.edu' }, { role: 'employer', email: 'faculty2@example.com' } ],
    appId: 'ta-portal'
  };
  const res = await fetch(url, { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(body)});
  console.log('Status', res.status);
  console.log(await res.text());
})();

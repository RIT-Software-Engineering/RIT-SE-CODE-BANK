const { createCandidateProfile } = require('./server/database/query_db');
(async () => {
  try {
    const res = await createCandidateProfile({
      uid: 6007,
      username: 'bgg6007',
      password: 'TempP@ss123!',
      fname: 'Ben',
      lname: 'Griffin',
      email: 'bgg6007@rit.edu',
      pronouns: 'he/him',
      role: 'CANDIDATE',
      year: 4,
      major: 'Software Engineering',
      graduateStatus: 'UNDERGRAD',
    });
    console.log('Created:', res);
  } catch (e) {
    console.error('Create failed', e);
  }
})();

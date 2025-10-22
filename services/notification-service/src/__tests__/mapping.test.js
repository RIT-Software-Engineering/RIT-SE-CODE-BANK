import { jest } from '@jest/globals';

// Import the module under test (no nodemailer mocking needed here)
const mod = await import('../routes/notify.js');

describe('template mapping', () => {
  test('APPLICATION_RECEIVED verbose event maps to candidate_email template', async () => {
    const { loadTemplateForRole } = mod;
    const verboseEvent = 'APPLICATION_RECEIVED :: Ben Griffin -> Update (Position)';
    // appId 'ta-portal' exists in repo templates; role candidate should resolve
    const tpl = loadTemplateForRole(verboseEvent, 'candidate', 'email', 'ta-portal');
    expect(typeof tpl).toBe('function');
    // rendering with a minimal context should produce a string
    const html = tpl({ candidate_name: 'Ben Griffin', job_title: 'TA', new_status: 'Received' });
    expect(typeof html).toBe('string');
    expect(html.length).toBeGreaterThan(10);
  });
});

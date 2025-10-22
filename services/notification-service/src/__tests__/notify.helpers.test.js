describe('notify helpers', () => {
  test('cleanName preserves provided names after trimming', async () => {
    const { cleanName } = await import('../routes/notify.js');
    // We expect names to be normalized only for spacing/commas, not collapsed.
    expect(cleanName('Ben G G')).toBe('Ben G G');
    expect(cleanName('Alice M M ')).toBe('Alice M M');
    expect(cleanName('Single')).toBe('Single');
    expect(cleanName(null)).toBe(null);
  });

  test('normalizeContext maps aliases', async () => {
    const { normalizeContext } = await import('../routes/notify.js');
    const input = {
      course: 'CS 101',
      jobTitle: 'TA',
      hiringManager: 'Prof X',
      applicantName: 'Alice B B',
      application_url: 'https://app',
    };
    const out = normalizeContext(input);
    expect(out.course_name).toBe('CS 101');
    expect(out.job_title).toBe('TA');
    expect(out.professor).toBe('Prof X');
    expect(out.candidate_name).toBe('Alice B B');
    expect(out.app_link).toBe('https://app');
  });

  test('defaultSubject candidate vs employer', async () => {
    const { defaultSubject } = await import('../routes/notify.js');
    const ctx = { job_title: 'TA for SWEN-352', new_status: 'Interview' };
    expect(defaultSubject('candidate', ctx)).toMatch(/Application Update/);
    const ctx2 = { candidate_name: 'Ben', job_title: 'TA', new_status: 'approved' };
    expect(defaultSubject('employer', ctx2)).toContain('Ben');
  });
});

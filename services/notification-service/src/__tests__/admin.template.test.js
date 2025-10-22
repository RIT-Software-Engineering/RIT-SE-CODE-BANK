test('admin gets admin_email template for application_status_changed', async () => {
  const { loadTemplateForRole, normalizeAppId } = await import('../routes/notify.js');
  const tpl = loadTemplateForRole('application_status_changed', 'admin', 'email', 'ta-portal');
  expect(tpl).not.toBeNull();
  const rendered = tpl({ candidate_name: 'Ben G', new_status: 'approved', job_title: 'TA', recipient: { name: 'Alice' }, app_link: 'https://portal' });
  // admin template should include the heading 'Administrative Update' per the app-scoped template
  expect(rendered).toEqual(expect.stringContaining('Administrative Update'));
});

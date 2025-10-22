describe('slack channel', () => {
  test('headers throws when no token', async () => {
    const orig = process.env.SLACK_BOT_TOKEN;
    delete process.env.SLACK_BOT_TOKEN;
    const mod = await import('../channels/slack.js');
    expect(() => mod.headers()).toThrow(/SLACK_BOT_TOKEN/);
    process.env.SLACK_BOT_TOKEN = orig;
  });
});

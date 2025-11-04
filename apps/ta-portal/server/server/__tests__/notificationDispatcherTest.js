// __tests__/notificationDispatcher.test.js

// The server no longer dispatches channels directly; it proxies to the
// notification-service. Update the test to validate the proxy POST payload
// instead of mocking channel senders.

let dispatchNotification;

describe('dispatchNotification (proxy to notification-service)', () => {
  let originalFetch;
  let calls;

  beforeEach(() => {
    // stub global fetch
    originalFetch = global.fetch;
    calls = [];
    global.fetch = jest.fn(async (url, opts = {}) => {
      calls.push({ url, opts });
      return {
        ok: true,
        status: 200,
        json: async () => ({ ok: true, dispatched: true }),
        text: async () => 'ok',
      };
    });
    // ensure module picks up the stubbed fetch
    jest.resetModules();
    ({ dispatchNotification } = require('@server/utils/notifications'));
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  test('posts to notification service with expected payload', async () => {
    const res = await dispatchNotification('bgg6007', { subject: 'Hello', message: 'Test', userEmail: 'bgg6007@rit.edu' });
    expect(res).toEqual(expect.objectContaining({ ok: true }));
    expect(calls.length).toBe(1);
    const { url, opts } = calls[0];
    expect(url).toMatch(/\/api\/notifications\/dispatch\//);
    expect(opts.method).toBe('POST');
    expect(opts.headers['Content-Type']).toBe('application/json');
    const body = JSON.parse(opts.body);
    expect(body).toEqual(expect.objectContaining({
      userId: 'bgg6007',
      subject: 'Hello',
      message: 'Test',
      userEmail: 'bgg6007@rit.edu',
    }));
  });
});

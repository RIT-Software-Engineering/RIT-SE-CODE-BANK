// __tests__/notificationPreferencesAPI.test.js
const request = require('supertest');
const app = require('@server/routing/index');
jest.mock('../../../../../packages/notification-client/index.cjs', () => ({
  getPreferences: jest.fn(),
  setPreferences: jest.fn(),
}));
const client = require('../../../../../packages/notification-client/index.cjs');


describe('Notification Preferences API', () => {
  beforeEach(async () => {
    client.getPreferences.mockReset();
    client.setPreferences.mockReset();
  });

  test('GET returns defaults when no row', async () => {
    client.getPreferences.mockResolvedValue({ notifyEmail: true, notifySlack: false });
    const res = await request(app).get('/api/db/notifications/preferences?username=bgg6007');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ notifyEmail: true, notifySlack: false });
  });

  test('PUT upserts correctly', async () => {
    client.setPreferences.mockResolvedValue({ ok: true });
    const res = await request(app)
      .put('/api/db/notifications/preferences')
      .send({ username: 'bgg6007', notifyEmail: false, notifySlack: true });
    expect(res.status).toBe(204);
    expect(client.setPreferences).toHaveBeenCalledWith('bgg6007', expect.objectContaining({ notifyEmail: false, notifySlack: true }));
  });

  test('Auth required (if implemented)', async () => {
    // when auth is in place, send request without token and expect 401
    // e.g. expect(res.status).toBe(401)
  });
});

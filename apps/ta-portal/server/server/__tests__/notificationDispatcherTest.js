// __tests__/notificationDispatcher.test.js

jest.mock('@services/notification-service/src/channels/email', () => ({
  sendEmail: jest.fn(),
}));
jest.mock('@services/notification-service/src/channels/slack', () => ({
  sendSlackDM: jest.fn(),
}));

// Mock the notification-client used by the dispatcher
jest.mock('../../../../../packages/notification-client/index.cjs', () => ({
  getPreferences: jest.fn(),
}));

// Pull the mocked functions into the test scope so the `expect(sendEmail)`
// and `expect(sendSlackDM)` assertions work as written.
const { sendEmail } = require('@services/notification-service/src/channels/email');
const { sendSlackDM } = require('@services/notification-service/src/channels/slack');

const { prisma } = require('@server/database/prisma');
const { dispatchNotification } = require('@server/routing/notifications');
const client = require('../../../../../packages/notification-client/index.cjs');

describe('dispatchNotification', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('both enabled → calls both email and slack', async () => {
    client.getPreferences.mockResolvedValue({ notifyEmail: true, notifySlack: true });
    await dispatchNotification('bgg6007', { subject: 'Hello', body: 'Test' });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendSlackDM).toHaveBeenCalledTimes(1);
  });

  test('email off → only Slack called', async () => {
    client.getPreferences.mockResolvedValue({ notifyEmail: false, notifySlack: true });
    await dispatchNotification('bgg6007', { subject: 'Hello', body: 'Test' });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendSlackDM).toHaveBeenCalledTimes(1);
  });

  test('slack off → only Email called', async () => {
    client.getPreferences.mockResolvedValue({ notifyEmail: true, notifySlack: false });
    await dispatchNotification('bgg6007', { subject: 'Hello', body: 'Test' });
    expect(sendEmail).toHaveBeenCalledTimes(1);
    expect(sendSlackDM).not.toHaveBeenCalled();
  });

  test('both off → neither called', async () => {
    client.getPreferences.mockResolvedValue({ notifyEmail: false, notifySlack: false });
    await dispatchNotification('bgg6007', { subject: 'Hello', body: 'Test' });
    expect(sendEmail).not.toHaveBeenCalled();
    expect(sendSlackDM).not.toHaveBeenCalled();
  });
});

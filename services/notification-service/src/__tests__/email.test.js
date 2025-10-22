import { jest } from '@jest/globals';

// Mock nodemailer before importing the module under test
const sendMailMock = jest.fn().mockResolvedValue({ messageId: 'abc' });
jest.unstable_mockModule('nodemailer', () => ({
  createTransport: jest.fn(() => ({ sendMail: sendMailMock })),
}));

describe('email channel', () => {
  test('sendEmail uses default from when SMTP_FROM not set', async () => {
    delete process.env.SMTP_FROM;
    const mod = await import('../channels/email.js');
    const sendEmail = mod.sendEmail;

    const info = await sendEmail({ to: 'x@x.com', subject: 's' });
    expect(info).toHaveProperty('messageId', 'abc');
    expect(sendMailMock).toHaveBeenCalledTimes(1);
    const calledArgs = sendMailMock.mock.calls[0][0];
    expect(calledArgs.from).toBe('se-apps@rit.edu');
  });
});

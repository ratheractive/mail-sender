process.env.DOTENV_PATH = '.inexistent';

process.env.SMTP_HOST = 'smtp.host.local';
process.env.SMTP_USER = 'test_user';
process.env.SMTP_PASSWORD = 'test_pass';
process.env.TO_EMAIL = 'toemail@mydomain.test';
process.env.FROM_EMAIL = 'from@domain.test';
process.env.HONEYPOT_FIELD = 'website';
process.env.MIN_SUBMIT_SECONDS = '3';

import request from 'supertest';
import app from '../src/app'

let mockSendMail = jest.fn();

jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockImplementation(({ from, to, subject, text }) => {
        mockSendMail(from, to, subject, text);
        return { messageId: 'testMessageId' }
      }),
    }),
  };
});

const human = {
  from: 'client@external.com',
  message: 'Test message',
  website: '',
  elapsed_ms: 5000,
};

describe('POST /send-mail with spam protection', () => {
  beforeEach(() => mockSendMail.mockClear());

  it('sends a submission that passes both checks', async () => {
    const res = await request(app)
      .post('/send-mail')
      .send(human)
      .expect(200);

    expect(res.body.messageId).toBe('testMessageId');
    expect(mockSendMail).toHaveBeenCalledTimes(2);
  });

  it('sends a multipart submission, where every value is a string', async () => {
    await request(app)
      .post('/send-mail')
      .field('from', human.from)
      .field('message', human.message)
      .field('website', '')
      .field('elapsed_ms', '5000')
      .expect(200);

    expect(mockSendMail).toHaveBeenCalledTimes(2);
  });

  it.each([
    { description: 'the honeypot is filled', body: { ...human, website: 'http://spam.test' } },
    { description: 'the honeypot is missing', body: { ...human, website: undefined } },
    { description: 'it was submitted too fast', body: { ...human, elapsed_ms: 1200 } },
    { description: 'elapsed_ms is missing', body: { ...human, elapsed_ms: undefined } },
    { description: 'elapsed_ms is not a number', body: { ...human, elapsed_ms: 'soon' } },
    { description: 'it is spam and also invalid', body: { website: 'x' } },
  ])('pretends to send but sends nothing when $description', async ({ body }) => {
    const res = await request(app)
      .post('/send-mail')
      .send(body)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body.message).toBe('Email sent');
    expect(res.body.messageId).toMatch(/^<[0-9a-f-]{36}@domain\.test>$/);
    expect(mockSendMail).not.toHaveBeenCalled();
  });
});

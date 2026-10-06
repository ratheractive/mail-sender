process.env.DOTENV_PATH = '.inexistent';

process.env.SMTP_HOST = 'smtp.host.local';
process.env.SMTP_USER = 'test_user';
process.env.SMTP_PASSWORD = 'test_pass';
process.env.TO_EMAIL = 'toemail@mydomain.test';
process.env.FROM_EMAIL = 'from@domain.test';

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

describe('GET /health', () => {
  it('reports the build version, "dev" outside an image', async () => {
    const res = await request(app).get('/health').expect(200);
    expect(res.body).toEqual({ status: 'ok', version: 'dev' });
  });
});

describe('POST /send-mail', () => {
  beforeEach(() => mockSendMail.mockClear());

  it('responds with json', async () => {
    const reqBody = {
      from: 'client@external.com',
      message: 'Test message',
    };
    const res = await request(app)
      .post('/send-mail')
      .send(reqBody)
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('messageId');
    expect(mockSendMail).toHaveBeenCalledTimes(2)
    expect(mockSendMail).toHaveBeenNthCalledWith(1, "from@domain.test", "toemail@mydomain.test", "From Web Form: \"No Subject\"", `From: Anonymous (client@external.com)
Subject: No Subject
Message:
Test message
`);
    expect(mockSendMail).toHaveBeenNthCalledWith(2, "from@domain.test", "client@external.com", "We received your message", `Hi,

Thank you for reaching out. We'll get back to you as soon as we can.

Have a great day,
`);
  });

  it('repeats nothing the visitor typed in the confirmation', async () => {
    await request(app)
      .post('/send-mail')
      .send({
        from: 'victim@external.com',
        name: 'Visit http://spam.test',
        subject: 'Cheap pills',
        message: 'Buy now at http://spam.test',
      })
      .expect(200);

    const [, to, subject, text] = mockSendMail.mock.calls[1];
    expect(to).toBe('victim@external.com');
    expect(`${subject}\n${text}`).not.toMatch(/spam\.test|Cheap pills|Buy now/);
  });

  it.each([
    { field: 'from', value: undefined, errorMessage: 'From is not a valid email' },
    { field: 'message', value: undefined, errorMessage: 'Message is required' }
  ])('responds with validation error when "$field" is "$value"', async ({ field, value, errorMessage }) => {
    const reqBody: { [field: string]: string } = {
      from: 'client@external.com',
      message: 'Test message',
    };

    if (value == undefined) {
      delete reqBody[field];
    } else {
      reqBody[field] = value;
    }

    const res = await request(app)
      .post('/send-mail')
      .send(reqBody)
      .expect('Content-Type', /json/)
      .expect(422);

    expect(res.body).toHaveProperty('errors');
    expect(res.body.errors).toEqual(expect.arrayContaining([{
      msg: errorMessage,
      path: field,
      location: 'body',
      type: 'field'
    }]));
  });
});

process.env.SMTP_HOST= 'smtp.host.local';
process.env.SMTP_USER = 'test_user';
process.env.SMTP_PASSWORD = 'test_pass';
process.env.TO_EMAIL = 'toemail@mydomain.test';
process.env.FROM_EMAIL= 'from@domain.test';
process.env.DUMMY_MODE= 'false';

import request from 'supertest';
import app from '../src/app'; // export your Express application from your server file

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

describe('POST /send-mail', () => {
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
    expect(mockSendMail).toHaveBeenNthCalledWith(1, "from@domain.test", "toemail@mydomain.test", "From Web Form: \"No Subject\"", `Message from Anonymous (client@external.com)

Subject: No Subject

Message:
Test message
`);
    expect(mockSendMail).toHaveBeenNthCalledWith(2, "from@domain.test", "client@external.com", "Confirmation: Your email regarding \"No Subject\" was received", `Hi Anonymous,

We have received your email with the subject \"No Subject\". Here is a copy of your message:

Test message

Best regards,
Your Team`);
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

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
      from: 'test@test.com',
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
    expect(mockSendMail).toHaveBeenNthCalledWith(1, "test@test.com", "your_toemail", "From Web Form: \"No Subject\"", `Hello,

This is a message from Anonymous.

Subject: From Web Form: &quot;No Subject&quot;

Message:
Test message

Regards,
Anonymous
`);
    expect(mockSendMail).toHaveBeenNthCalledWith(2, "your_toemail", "test@test.com", "Confirmation: Your email regarding \"No Subject\" was received", `Hi Anonymous,

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
      from: 'test@test.com',
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

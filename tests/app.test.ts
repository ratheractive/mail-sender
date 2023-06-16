import request from 'supertest';
import app from '../src/app'; // export your Express application from your server file

jest.mock('nodemailer', () => {
  return {
    createTransport: jest.fn().mockReturnValue({
      sendMail: jest.fn().mockResolvedValue({ messageId: 'testMessageId' }),
    }),
  };
});

describe('POST /send-mail', () => {
  it('responds with json', async () => {
    const res = await request(app)
      .post('/send-mail')
      .send({
        from: 'test@test.com',
        message: 'Test message',
      })
      .expect('Content-Type', /json/)
      .expect(200);

    expect(res.body).toHaveProperty('message');
    expect(res.body).toHaveProperty('messageId');
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

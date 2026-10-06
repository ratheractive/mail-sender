import { mkdtempSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import request from 'supertest';
import type { Express } from 'express';

jest.mock('nodemailer', () => ({ createTransport: jest.fn().mockReturnValue({ sendMail: jest.fn() }) }));

const originalEnv = process.env;

// Loads a fresh copy of the app, so each test can configure it through env.
const loadApp = (env: { [key: string]: string } = {}) => {
  process.env = {
    ...originalEnv,
    DOTENV_PATH: '.inexistent',
    SMTP_HOST: 'smtp.host.local',
    SMTP_USER: 'test_user',
    SMTP_PASSWORD: 'test_pass',
    TO_EMAIL: 'toemail@mydomain.test',
    FROM_EMAIL: 'from@domain.test',
    ...env,
  };

  let app: Express | undefined;
  jest.isolateModules(() => {
    app = require('../src/app').default;
  });
  return app!;
};

const templateFile = (content: string) => {
  const file = path.join(mkdtempSync(path.join(tmpdir(), 'mail-sender-')), 'confirmation.hbs');
  writeFileSync(file, content);
  return file;
};

afterEach(() => {
  process.env = originalEnv;
});

describe('CORS_ORIGINS', () => {
  const preflight = (app: Express, origin: string) => request(app)
    .options('/send-mail')
    .set('Origin', origin)
    .set('Access-Control-Request-Method', 'POST')
    .set('Access-Control-Request-Headers', 'content-type');

  it('allows every origin when unset', async () => {
    const res = await preflight(loadApp(), 'https://anywhere.test');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('allows every origin when "*"', async () => {
    const res = await preflight(loadApp({ CORS_ORIGINS: '*' }), 'https://anywhere.test');
    expect(res.headers['access-control-allow-origin']).toBe('*');
  });

  it('allows only the listed origins, ignoring spaces around them', async () => {
    const app = loadApp({ CORS_ORIGINS: 'https://a.test, https://b.test' });

    expect((await preflight(app, 'https://b.test')).headers['access-control-allow-origin']).toBe('https://b.test');
    expect((await preflight(app, 'https://evil.test')).headers['access-control-allow-origin']).toBeUndefined();
  });
});

describe('confirmation templates', () => {
  it('may use the recipient address', () => {
    expect(() => loadApp({
      CONFIRMATION_SUBJECT: 'We received your message at {from}',
      CONFIRMATION_TEMPLATE: templateFile('Hi,\nwe will reply to {{from}}.\n'),
    })).not.toThrow();
  });

  it.each([
    'RE: {subject}',
    'Thanks {name}',
    '{message}',
  ])('refuse a subject that repeats visitor text: %s', (subject) => {
    expect(() => loadApp({ CONFIRMATION_SUBJECT: subject })).toThrow(/Config error - env.CONFIRMATION_SUBJECT uses/);
  });

  it.each([
    'Hi {{name}},',
    'Your message:\n{{{message}}}',
    '{{#if subject}}Re: {{ subject }}{{/if}}',
  ])('refuse a template that repeats visitor text: %s', (template) => {
    expect(() => loadApp({ CONFIRMATION_TEMPLATE: templateFile(template) })).toThrow(/Config error - .*confirmation\.hbs uses/);
  });
});

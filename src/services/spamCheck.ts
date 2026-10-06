import { randomUUID } from 'crypto';
import config from '../config';

// Milliseconds between the form being shown and being submitted, measured by the page.
export const ELAPSED_FIELD = 'elapsed_ms';

// Returns why a submission looks automated, or null when it passes.
// Both checks are strict: a missing field fails, so a bot that posts only the
// visible fields straight to the endpoint is caught as well.
export const spamReason = (body: { [key: string]: unknown }): string | null => {
  if (config.HONEYPOT_FIELD) {
    const value = body[config.HONEYPOT_FIELD];
    if (value === undefined) {
      return `honeypot field "${config.HONEYPOT_FIELD}" missing`;
    }
    if (value !== '') {
      return `honeypot field "${config.HONEYPOT_FIELD}" filled`;
    }
  }

  if (config.MIN_SUBMIT_SECONDS > 0) {
    const value = body[ELAPSED_FIELD];
    if (value === undefined) {
      return `${ELAPSED_FIELD} missing`;
    }
    const elapsed = Number(value);
    if (!(elapsed >= config.MIN_SUBMIT_SECONDS * 1000)) {
      return `submitted after ${value}ms, under ${config.MIN_SUBMIT_SECONDS}s`;
    }
  }

  return null;
}

// Shaped like a real SMTP message id, so a dropped submission looks delivered.
export const fakeMessageId = (): string => {
  return `<${randomUUID()}@${config.FROM_EMAIL.split('@').pop()}>`;
}

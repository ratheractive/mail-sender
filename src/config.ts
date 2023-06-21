import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import path from 'path';

dotenv.config({ path: process.env.DOTENV_PATH ?? ".env" });

function ensure(key: string, defaultValue?: string): string {
    const value = process.env[key] || defaultValue;

    if (value == null) {
        throw new Error(`Config error - missing env.${key}`);
    }

    return value;
}

const CONFIRMATION_TEMPLATE = ensure(
    'CONFIRMATION_TEMPLATE',
    path.resolve(__dirname, '..', 'templates', 'form-received-confirmation.hbs')
)

const FORM_TO_SMTP_TEMPLATE = ensure(
    'FORM_TO_SMTP_TEMPLATE',
    path.resolve(__dirname, '..', 'templates', 'form-to-smtp-text.hbs')
)

export default {
    PORT: ensure('PORT', '3000'),
    DUMMY_MODE: ensure('DUMMY_MODE', 'false') == 'true',
    SMTP_HOST: ensure('SMTP_HOST'),
    SMTP_PORT: ensure('SMTP_PORT', '465'),
    SMTP_USER: ensure('SMTP_USER'),
    SMTP_PASSWORD: ensure('SMTP_PASSWORD'),
    FROM_EMAIL: ensure('FROM_EMAIL'),
    TO_EMAIL: ensure('TO_EMAIL'),
    CORS_ORIGINS: ensure('CORS_ORIGINS', '*').split(','),
    CONFIRMATION_SUBJECT: ensure('CONFIRMATION_SUBJECT', 'RE: {subject}'),
    CONFIRMATION_TEMPLATE: readFileSync(CONFIRMATION_TEMPLATE, 'utf-8'),
    FORM_TO_SMTP_SUBJECT: ensure('FORM_TO_SMTP_SUBJECT', 'From Web Form: "{subject}"'),
    FORM_TO_SMTP_TEMPLATE: readFileSync(FORM_TO_SMTP_TEMPLATE, 'utf-8')
};

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

// The confirmation goes to whatever address the visitor typed, so it may carry nothing else
// they typed - otherwise anyone could use it to deliver their own text to a third party. It is
// rendered with {from} alone; refuse to start rather than send a confirmation with holes in it.
function ensureNoVisitorText(what: string, template: string, placeholder: RegExp): string {
    const match = template.match(placeholder);

    if (match) {
        throw new Error(`Config error - ${what} uses ${match[0]}, but a confirmation may only use from`);
    }

    return template;
}

// "*" allows every origin; anything else is a comma-separated list of exact origins.
function corsOrigins(value: string): string | string[] {
    if (value.trim() == '*') {
        return '*';
    }

    return value.split(',').map((origin) => origin.trim()).filter((origin) => origin != '');
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
    CORS_ORIGINS: corsOrigins(ensure('CORS_ORIGINS', '*')),
    CONFIRMATION_SUBJECT: ensureNoVisitorText(
        'env.CONFIRMATION_SUBJECT',
        ensure('CONFIRMATION_SUBJECT', 'We received your message'),
        /\{(name|subject|message)\}/
    ),
    CONFIRMATION_TEMPLATE: ensureNoVisitorText(
        CONFIRMATION_TEMPLATE,
        readFileSync(CONFIRMATION_TEMPLATE, 'utf-8'),
        /\{\{[^}]*\b(name|subject|message)\b[^}]*\}\}/
    ),
    FORM_TO_SMTP_SUBJECT: ensure('FORM_TO_SMTP_SUBJECT', 'From Web Form: "{subject}"'),
    FORM_TO_SMTP_TEMPLATE: readFileSync(FORM_TO_SMTP_TEMPLATE, 'utf-8'),
    HONEYPOT_FIELD: ensure('HONEYPOT_FIELD', ''),
    MIN_SUBMIT_SECONDS: Number(ensure('MIN_SUBMIT_SECONDS', '0'))
};

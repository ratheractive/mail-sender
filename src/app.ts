import express from 'express';
import bodyParser from 'body-parser';
import nodemailer, { SentMessageInfo } from 'nodemailer';
import config from './config';
import Handlebars from 'handlebars';
import multer from 'multer';
import cors from 'cors';
import { body, validationResult } from 'express-validator';
import Mail from 'nodemailer/lib/mailer';

const app = express();
const port = config.PORT;

const upload = multer();

app.use(cors({ origin: config.CORS_ORIGINS }));
app.use(bodyParser.json());

let transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT),
    secure: true,
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASSWORD
    }
});

console.log('SMTP transport created.');

const stringTpl = (tpl: string, values: { [key: string]: string }): string => {
    return Object.entries(values)
        .reduce((agr, [key, value]) => agr.replaceAll(`{${key}}`, value), tpl);
}

const hbsTpl = (path: string, values: { [key: string]: string }): string => {
    let template = Handlebars.compile(path);
    return template(values);
}

const sendMail = (mailOptions: Mail.Options): Promise<SentMessageInfo> => {
    if (config.DUMMY_MODE) {
        return Promise.resolve<SentMessageInfo>({ messageId: "message-id" })
    }
    return transporter.sendMail(mailOptions)
}

const sendConfirmationEmail = async (options: { from: string, name: string, subject: string, message: string }) => {
    let subject = stringTpl(config.CONFIRMATION_SUBJECT, options);
    let text = hbsTpl(config.CONFIRMATION_TEMPLATE, options);

    try {
        let confirmationInfo = await sendMail({
            from: config.FROM_EMAIL,
            to: options.from,
            subject,
            text
        });

        console.log(`Confirmation email sent: ${confirmationInfo.messageId}`);
    } catch (err) {
        console.error('Error sending confirmation email:', err);
    }
}

app.post('/send-mail', upload.none(),
    body('from').isEmail().withMessage('From is not a valid email'),
    body('message').isLength({ min: 1 }).withMessage('Message is required'),
    body('subject').default('No Subject'),
    body('name').default('Anonymous'),
    async (req, res) => {
        console.log('Received a new request.');

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.log('Validation errors:', errors.array());
            return res.status(422).json({ errors: errors.array() });
        }

        const { from, subject, message, name } = req.body;

        console.log(`Sending email from`);

        let smtpSubject = stringTpl(config.FORM_TO_SMTP_SUBJECT, req.body);
        let smtpText = hbsTpl(config.FORM_TO_SMTP_TEMPLATE, req.body);

        try {
            let info = await sendMail({
                from: config.FROM_EMAIL,
                to: config.TO_EMAIL,
                subject: smtpSubject,
                text: smtpText
            });
            console.log(`Email sent: ${info.messageId}`);

            sendConfirmationEmail({ from, name, subject, message });

            res.status(200).json({
                message: 'Email sent',
                messageId: info.messageId,
            });
        } catch (err) {
            console.error('Error sending email:', err);
            res.status(500).json({ message: 'Error sending email' });
        }
    });

if (process.env.TS_JEST == undefined) {

    app.get('/health', (req, res) => {
        res.status(200).json({
            "status": "ok"
        })
    });

    const server = app.listen(port, () => console.log(`App listening at http://localhost:${port}`));

    ['SIGHUP', 'SIGINT', 'SIGTERM'].forEach((signal) => {
        process.on(signal, () => {
            server.close(() => {
                console.log(`server stopped by ${signal}`)
            })
        })
    })
}

export default app
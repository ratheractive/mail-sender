import express from 'express';
import bodyParser from 'body-parser';
import nodemailer from 'nodemailer';
import config from './config';
import Handlebars from 'handlebars';
import multer from 'multer';
import { body, validationResult } from 'express-validator';

const app = express();
const port = process.env.PORT;

const upload = multer();

app.use(bodyParser.json());

let transporter = nodemailer.createTransport({
    host: config.SMTP_HOST,
    port: Number(config.SMTP_PORT),
    secure: true, // change to false if the port is not 465
    auth: {
        user: config.SMTP_USER,
        pass: config.SMTP_PASS
    }
});

app.post('/send-mail', upload.none(),
    body('from').isEmail().withMessage('From is not a valid email'),
    body('message').isLength({ min: 1 }).withMessage('Message is required'),
    body('subject').default('No Subject'),
    body('name').default('Anonymous'),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        const { from, subject, message, name } = req.body;

        // create the smtp email body using a handlebars template
        let smtpTemplate = Handlebars.compile(config.FORM_TO_SMTP_TEMPLATE);
        let smtpText = smtpTemplate({ name, subject, message });

        try {
            let mailOptions = {
                from: from,
                to: config.TO_EMAIL,
                subject: subject,
                text: smtpText
            };

            // Send mail with defined transport object
            let info = await transporter.sendMail(mailOptions);

            // Send a confirmation email back to the sender
            let confirmationSubject = config.CONFIRMATION_SUBJECT.replace("{subject}", subject);
            let template = Handlebars.compile(config.CONFIRMATION_TEMPLATE);
            let confirmationText = template({ name, subject });

            let confirmationMailOptions = {
                from: config.TO_EMAIL,
                to: from,
                subject: confirmationSubject,
                text: confirmationText
            };

            let confirmationInfo = await transporter.sendMail(confirmationMailOptions);

            res.status(200).json({
                message: 'Email sent',
                messageId: info.messageId,
                confirmationMessage: 'Confirmation email sent',
                confirmationMessageId: confirmationInfo.messageId
            });
        } catch (err) {
            console.error(err);
            res.status(500).json({ message: 'Error sending email' });
        }
    });

app.listen(port, () => console.log(`App listening at http://localhost:${port}`));

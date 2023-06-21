import express from 'express';
import { hbsTpl, stringTpl } from '../services/templates';
import config from '../config';
import { sendMail } from '../services/sendMail';
import multer from 'multer';
import { body, validationResult } from 'express-validator';
const upload = multer();

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

export const sendMailController = (app: express.Express) => {
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
}
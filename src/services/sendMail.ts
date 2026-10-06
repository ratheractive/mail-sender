import nodemailer, { SendMailOptions } from 'nodemailer';
import config from '../config';

let transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: Number(config.SMTP_PORT),
  secure: true,
  auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD
  }
});

// Only the message id is read from the result, which keeps DUMMY_MODE's stand-in honest.
export const sendMail = (mailOptions: SendMailOptions): Promise<{ messageId: string }> => {
  if (config.DUMMY_MODE) {
      return Promise.resolve({ messageId: "message-id" })
  }
  return transporter.sendMail(mailOptions)
}


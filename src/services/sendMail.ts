import nodemailer, { SentMessageInfo } from 'nodemailer';
import config from '../config';
import { Options } from 'nodemailer/lib/mailer';

let transporter = nodemailer.createTransport({
  host: config.SMTP_HOST,
  port: Number(config.SMTP_PORT),
  secure: true,
  auth: {
      user: config.SMTP_USER,
      pass: config.SMTP_PASSWORD
  }
});

export const sendMail = (mailOptions: Options): Promise<SentMessageInfo> => {
  if (config.DUMMY_MODE) {
      return Promise.resolve<SentMessageInfo>({ messageId: "message-id" })
  }
  return transporter.sendMail(mailOptions)
}


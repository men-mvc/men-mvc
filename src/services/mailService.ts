import { mailer, MailAttachment } from '@men-mvc/core';
import config from 'config';

export const sendMail = async (options: {
  to: string;
  subject: string;
  body: string;
  attachments?: MailAttachment[];
}): Promise<void> => {
  await mailer.send(options);
};

export const sendWelcomeMail = async (user: {
  email: string;
  name: string;
}) => sendMail({
  to: user.email,
  subject: `Welcome`,
  body: `Hey ${user.name}, welcome to ${config.get(`app.name`)}`
});

export const sendVerifyEmailMail = async (
  user: {
    email: string;
    name: string;
  },
  emailVerificationLink: string
) => sendMail({
  to: user.email,
  subject: `Verify your email`,
  body: `Please verify your email by visiting the link, <a href="${emailVerificationLink}">${emailVerificationLink}</a>`
});

export const sendPasswordResetMail = async (
  user: {
    name: string;
    email: string;
  },
  passwordResetLink: string
) => sendMail({
  to: user.email,
  subject: `Reset Password`,
  body: `Please reset your account's password by visiting the link, <a href="${passwordResetLink}">${passwordResetLink}</a>`
});

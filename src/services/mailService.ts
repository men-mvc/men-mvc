import { mailer, SendMailOptions } from '@men-mvc/mail';

const templateLayout = `layout`; // set the layout file, src/views/emails/layout.handlebars

export const sendMail = async (options: SendMailOptions): Promise<void> => {
  await mailer.send(options);
};

export const sendWelcomeMail = async (user: {
  email: string;
  name: string;
}) => {
  await sendMail({
    to: user.email,
    subject: `Welcome`,
    template: {
      view: `welcome`,
      data: {
        name: user.name
      },
      layout: templateLayout
    }
  });
};

export const sendVerifyEmailMail = async (
  user: {
    email: string;
    name: string;
  },
  emailVerificationLink: string
) =>
  sendMail({
    to: user.email,
    subject: `Verify your email`,
    template: {
      view: `verifyEmail`,
      data: {
        emailVerificationLink
      },
      layout: templateLayout
    }
  });

export const sendPasswordResetMail = async (
  user: {
    name: string;
    email: string;
  },
  passwordResetLink: string
) =>
  sendMail({
    to: user.email,
    subject: `Reset Password`,
    template: {
      view: `resetPassword`,
      data: {
        passwordResetLink
      },
      layout: templateLayout
    }
  });

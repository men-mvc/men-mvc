import { mailer } from '@men-mvc/mail';
import { Service } from 'typedi';

const templateLayout = `layout`; // set the layout file, src/views/emails/layout.handlebars

@Service()
export class MailService {
  public sendWelcomeMail(user: { email: string; name: string }): Promise<void> {
    return mailer.send({
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
  }

  public sendVerifyEmailMail(
    user: {
      email: string;
      name: string;
    },
    emailVerificationLink: string
  ) {
    return mailer.send({
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
  }

  public sendPasswordResetMail(
    user: {
      name: string;
      email: string;
    },
    passwordResetLink: string
  ): Promise<void> {
    return mailer.send({
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
  }
}

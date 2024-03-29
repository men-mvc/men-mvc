import { SinonStub, stub, assert } from 'sinon';
import { StatusCodes } from '@men-mvc/foundation';
import { Container } from 'typedi';
import { faker } from '@faker-js/faker';
import { config } from '../../../src/config';
import { withApplication } from '../../testUtilities';
import { MailService } from '../../../src/services/mailService';
import { createTestUser } from '../../factories/userFactory';
import { makeResendVerifyEmailLinkRequest } from '../requests';
import { VerificationTokenModel } from '../../../src/models/verificationToken';
import { VerificationTokenType } from '../../../src/types';
import { assertHasValidationError } from '../../assertions';

describe(`Auth Route - Resent Verify Email Link`, () => {
  withApplication();
  const mailService = Container.get(MailService);

  describe(`POST /api/auth/email-verification-link/resend`, () => {
    let sendVerifyEmailMailStub: SinonStub;
    beforeEach(() => {
      sendVerifyEmailMailStub = stub(mailService, `sendVerifyEmailMail`);
      sendVerifyEmailMailStub.callsFake(jest.fn());
    });
    afterEach(() => {
      sendVerifyEmailMailStub.restore();
    });

    it(`should re-send the email including verification token to verify user's email`, async () => {
      const user = await createTestUser();
      const { status } = await makeResendVerifyEmailLinkRequest(user.email);

      expect(status).toBe(StatusCodes.NO_CONTENT);
      const verificationToken = await VerificationTokenModel.findOne({
        user: user._id,
        type: VerificationTokenType.VERIFY_EMAIL
      });
      if (!verificationToken) {
        throw new Error(`Verification token was not generated.`);
      }
      const expectedVerificationLink = encodeURI(
        `${config.app.feUrl}/auth/verify-email?token=${verificationToken.token}&email=${user.email}`
      );
      assert.calledOnceWithExactly(
        sendVerifyEmailMailStub,
        {
          email: user.email,
          name: user.name
        },
        expectedVerificationLink
      );
    });

    it(`should return bad request error when the user with provided email does not exist`, async () => {
      const { status } = await makeResendVerifyEmailLinkRequest(
        faker.internet.email()
      );

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    it(`should fail validation when the email is empty`, async () => {
      await createTestUser();
      const { body, status } = await makeResendVerifyEmailLinkRequest(``);

      expect(status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      assertHasValidationError(body, 'email', 'Email is required.');
    });
  });
});

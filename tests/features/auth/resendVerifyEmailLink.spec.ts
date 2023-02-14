import sinon, { SinonStub } from 'sinon';
import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import {
  clearDatabase,
  closeDatabaseConnection,
  initApplication
} from '../../testUtilities';
import * as mailService from '../../../src/services/mailService';
import { sendVerifyEmailMail } from '../../../src/services/mailService';
import { createTestUser } from '../../factories/userFactory';
import { makeResendVerifyEmailLinkRequest } from '../../requests';
import {
  VerificationTokenModel
} from '../../../src/models/verificationToken';
import { VerificationTokenType } from '../../../src/types';
import { assertResponseHasValidationError } from '../../assertions';
const testConfig = require('../../../config/test.json');

describe(`Auth Route - Resent Verify Email Link`, () => {
  beforeAll(async () => {
    await initApplication();
  });
  afterAll(async () => {
    await closeDatabaseConnection();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  describe(`POST /api/auth/email-verification-link/resend`, () => {
    let sendVerifyEmailMailStub: SinonStub;
    beforeEach(() => {
      sendVerifyEmailMailStub = sinon.stub(mailService, `sendVerifyEmailMail`);
      sendVerifyEmailMailStub.callsFake(
        jest.fn().mockImplementation((user, verificationLink) => {})
      );
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
        `${testConfig.app.feUrl}/auth/verify-email?token=${verificationToken.token}&email=${user.email}`
      );
      sinon.assert.calledOnceWithExactly(
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
      assertResponseHasValidationError(body, 'email', 'Email is required.');
    });
  });
});

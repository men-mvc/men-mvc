import { StatusCodes } from 'http-status-codes';
import sinon, { SinonStub } from 'sinon';
import dateAndTime from 'date-and-time';
import { DocumentType } from '@typegoose/typegoose';
import { faker } from '@faker-js/faker';
import {
  clearDatabase,
  closeDatabaseConnection,
  getPasswordValidationTestData,
  initApplication,
  mockNow,
  restoreNowMock
} from '../../testUtilities';
import { ResetPasswordPayload, TestValidationRequestItem } from '../../types';
import { createTestUser } from '../../factories/userFactory';
import * as mailService from '../../../src/services/mailService';
import {
  VerificationToken,
  VerificationTokenModel
} from '../../../src/models/verificationToken';
import { createTestVerificationToken } from '../../factories/verificationTokenFactory';
import { User } from '../../../src/models/user';
import { validatePassword } from '../../../src/services/authService';
import { findUserById } from '../../../src/services/userService';
import {
  makeLoginRequest,
  makeRequestPasswordResetRequest,
  makeResetPasswordRequest
} from '../../requests';
import { USER_PASSWORD } from '../../globals';
import { assertResponseHasValidationError } from '../../assertions';
import { VerificationTokenType } from '../../../src/types';
import testConfig from '../../../config/test.json';

describe(`Auth Route - Reset Password`, () => {
  let sendPasswordResetMailStub: SinonStub;
  beforeAll(async () => {
    mockNow();
    await initApplication();
  });
  afterAll(async () => {
    restoreNowMock();
    await closeDatabaseConnection();
  });
  beforeEach(async () => {
    sendPasswordResetMailStub = sinon.stub(
      mailService,
      `sendPasswordResetMail`
    );
  });
  afterEach(async () => {
    await clearDatabase();
    sendPasswordResetMailStub.restore();
  });

  describe(`POST /api/auth/request-password-reset`, () => {
    it(`should generate password-reset link when the request is successful`, async () => {
      const user = await createTestUser();
      const { status } = await makeRequestPasswordResetRequest(user.email);

      expect(status).toBe(StatusCodes.NO_CONTENT);
      const verificationToken = await VerificationTokenModel.findOne({
        user: user.id
      });
      if (!verificationToken) {
        throw new Error(`Verification token does not exist.`);
      }
      expect(verificationToken.type).toBe(VerificationTokenType.PASSWORD_RESET);
    });

    it(`should email password-reset link to user when request is successful`, async () => {
      const user = await createTestUser();
      const { status } = await makeRequestPasswordResetRequest(user.email);

      expect(status).toBe(StatusCodes.NO_CONTENT);
      const verificationToken = (await VerificationTokenModel.findOne({
        user: user.id
      })) as DocumentType<VerificationToken>;
      const expectedLink = encodeURI(
        `${testConfig.app.feUrl}/auth/reset-password?token=${verificationToken.token}&email=${user.email}`
      );
      sinon.assert.calledOnceWithExactly(
        sendPasswordResetMailStub,
        {
          name: user.name,
          email: user.email
        },
        expectedLink
      );
    });

    it(`should fail validation when email is empty`, async () => {
      const { body, status } = await makeRequestPasswordResetRequest(``);

      expect(status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      assertResponseHasValidationError(body, 'email', 'Email is required.');
    });

    it(`should fail validation when user with email does not exist`, async () => {
      const { body, status } = await makeRequestPasswordResetRequest(
        faker.internet.email()
      );

      expect(status).toBe(StatusCodes.BAD_REQUEST);
      expect(body.error.message).toBe(`Account does not exist.`);
    });
  });

  describe(`PUT /api/auth/reset-password`, () => {
    it(`should reset the password when the input values are valid`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.PASSWORD_RESET
      });
      let user = (await verificationToken.getUser()) as DocumentType<User>;
      expect(
        await validatePassword(USER_PASSWORD, user.password as string)
      ).toBeTruthy();
      const { status } = await makeResetPasswordRequest(
        getResetPasswordPayload({
          email: user.email,
          token: verificationToken.token
        })
      );

      expect(status).toBe(StatusCodes.NO_CONTENT);
      user = (await findUserById(user.id)) as DocumentType<User>;
      expect(
        await validatePassword(`NewPassword.1234`, user.password as string)
      ).toBeTruthy();
    });

    it(`should flag the token as used after the password is reset`, async () => {
      let verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.PASSWORD_RESET
      });
      expect(verificationToken.verifiedAt).toBeUndefined();
      const user = (await verificationToken.getUser()) as DocumentType<User>;
      const { status } = await makeResetPasswordRequest(
        getResetPasswordPayload({
          email: user.email,
          token: verificationToken.token
        })
      );

      expect(status).toBe(StatusCodes.NO_CONTENT);
      verificationToken = (await VerificationTokenModel.findById(
        verificationToken.id
      )) as DocumentType<VerificationToken>;
      expect(verificationToken.verifiedAt).not.toBeUndefined();
      expect((verificationToken.verifiedAt as Date).getTime()).toBe(
        new Date().getTime()
      );
    });

    test(`user can login using the new password`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.PASSWORD_RESET
      });
      const user = (await verificationToken.getUser()) as DocumentType<User>;
      const { status: resetStatus } = await makeResetPasswordRequest(
        getResetPasswordPayload({
          email: user.email,
          token: verificationToken.token
        })
      );
      expect(resetStatus).toBe(StatusCodes.NO_CONTENT);
      // login using new password
      const { status: loginStatus } = await makeLoginRequest({
        email: user.email,
        password: `NewPassword.1234`
      });
      expect(loginStatus).toBe(StatusCodes.OK);
    });

    it(`return return error when the token does not exist`, async () => {
      const user = await createTestUser();
      const { status } = await makeResetPasswordRequest(
        getResetPasswordPayload({
          email: user.email
        })
      );

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    it(`should return error when the token has expired`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.PASSWORD_RESET,
        expiresAt: dateAndTime.addSeconds(new Date(), -100)
      });
      const user = (await verificationToken.getUser()) as DocumentType<User>;
      const { status } = await makeResetPasswordRequest(
        getResetPasswordPayload({
          email: user.email,
          token: verificationToken.token
        })
      );

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    it(`should return error when the token type is wrong`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.VERIFY_EMAIL,
        expiresAt: dateAndTime.addDays(new Date(), 5)
      });
      const user = (await verificationToken.getUser()) as DocumentType<User>;
      const { status } = await makeResetPasswordRequest(
        getResetPasswordPayload({
          email: user.email,
          token: verificationToken.token
        })
      );

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    it(`should return error when the token belongs to different user`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.PASSWORD_RESET,
        expiresAt: dateAndTime.addDays(new Date(), 5)
      });
      const differentUser = await createTestUser();
      const { status } = await makeResetPasswordRequest(
        getResetPasswordPayload({
          email: differentUser.email,
          token: verificationToken.token
        })
      );

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    it(`should return error when the token is already used`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.PASSWORD_RESET,
        expiresAt: dateAndTime.addDays(new Date(), 5),
        verifiedAt: dateAndTime.addDays(new Date(), -5)
      });
      const user = (await verificationToken.getUser()) as DocumentType<User>;
      const { status } = await makeResetPasswordRequest(
        getResetPasswordPayload({
          email: user.email,
          token: verificationToken.token
        })
      );

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    const testRequestData: TestValidationRequestItem[] = [
      {
        field: `email`,
        value: ``,
        expectedError: `Email is required.`
      },
      {
        field: `token`,
        value: ``,
        expectedError: `Token is required.`
      },
      ...getPasswordValidationTestData(`newPassword`)
    ];
    describe.each(testRequestData)(`Validate input value`, (fieldData) => {
      it(`should fail validation when ${fieldData.field} field's value is "${fieldData.value}"`, async () => {
        const { body, status } = await makeResetPasswordRequest({
          [fieldData.field]: fieldData.value
        });

        expect(status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
        assertResponseHasValidationError(
          body,
          fieldData.field,
          fieldData.expectedError
        );
      });
    });

    it(`should fail validation when passwordConfirmation field is empty`, async () => {
      const { body, status } = await makeResetPasswordRequest(
        getResetPasswordPayload({
          newPassword: `Testing.12345!`,
          passwordConfirmation: ``
        })
      );

      expect(status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      assertResponseHasValidationError(
        body,
        `passwordConfirmation`,
        `Please confirm your password.`
      );
    });

    it(`should fail validation when the new password and password confirmation do not match`, async () => {
      const { body, status } = await makeResetPasswordRequest(
        getResetPasswordPayload({
          newPassword: `Testing.12345!`,
          passwordConfirmation: `Testing.12333!`
        })
      );

      expect(status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      assertResponseHasValidationError(
        body,
        `passwordConfirmation`,
        `Passwords do not match.`
      );
    });
  });

  const getResetPasswordPayload = (
    data: Partial<ResetPasswordPayload>
  ): ResetPasswordPayload => {
    const defaultData: ResetPasswordPayload = {
      email: faker.internet.email(),
      token: faker.datatype.uuid(),
      newPassword: `NewPassword.1234`,
      passwordConfirmation: `NewPassword.1234`
    };

    return {
      ...defaultData,
      ...data
    };
  };
});

import { SinonStub, stub, assert } from 'sinon';
import { faker } from '@faker-js/faker';
import { StatusCodes, validatePassword } from '@men-mvc/foundation';
import { config } from '../../../src/config';
import {
  getPasswordValidationTestData,
  withApplication
} from '../../testUtilities';
import * as mailService from '../../../src/services/mailService';
import { findUserByEmail } from '../../../src/services/userService';
import { verifyAuthToken } from '../../../src/services/authService';
import { InputValidationTestData } from '../../types';
import { VerificationTokenModel } from '../../../src/models/verificationToken';
import { createTestUser } from '../../factories/userFactory';
import { makeLoginRequest, makeRegisterRequest } from '../requests';
import { USER_PASSWORD } from '../../globals';
import { assertHasValidationError, assertUserResponse } from '../../assertions';
import { RegisterPayload } from '../../../src/requests/types';

describe(`Auth Route - Register`, () => {
  withApplication();

  describe(`POST /api/auth/register`, () => {
    let sendWelcomeMailStub: SinonStub;
    let sendVerifyEmailMailStub: SinonStub;
    beforeEach(async () => {
      sendWelcomeMailStub = stub(mailService, `sendWelcomeMail`);
      sendVerifyEmailMailStub = stub(mailService, `sendVerifyEmailMail`);
    });
    afterEach(async () => {
      sendWelcomeMailStub.restore();
      sendVerifyEmailMailStub.restore();
    });

    it(`should create the user when the request is successful`, async () => {
      const payload = getPayload();
      const { body, status } = await makeRegisterRequest(payload);

      const user = await findUserByEmail(body.data.email);
      expect(status).toBe(StatusCodes.CREATED);
      expect(user).not.toBeNull();
      if (!user) {
        throw new Error(`User does not exist.`);
      }
      expect(user.name).toBe(payload.name);
      expect(user.email).toBe(payload.email?.toLowerCase());
      expect(user.password).not.toBeUndefined();
      expect(
        await validatePassword(
          payload.password as string,
          user.password as string
        )
      );
    });

    it(`should return the user when the request is successful`, async () => {
      const payload = getPayload();
      const { body, status } = await makeRegisterRequest(payload);

      const user = await findUserByEmail(body.data.email);
      expect(status).toBe(StatusCodes.CREATED);
      expect(user).not.toBeNull();
      if (!user) {
        throw new Error(`User does not exist.`);
      }
      await assertUserResponse(body.data, user);
    });

    test(`user should be able to login using the credentials used for registration`, async () => {
      const registerPayload = getPayload();
      const { status: registerStatus } = await makeRegisterRequest(
        registerPayload
      );
      expect(registerStatus).toBe(StatusCodes.CREATED);
      const { body: loginBody, status: loginStatus } = await makeLoginRequest({
        email: registerPayload.email,
        password: registerPayload.password
      });
      expect(loginStatus).toBe(StatusCodes.OK);
      expect(await verifyAuthToken(loginBody.data.accessToken)).toBeTruthy();
    });

    it(`should send welcome email when the user is registered`, async () => {
      const payload = getPayload();
      const { status } = await makeRegisterRequest(payload);

      expect(status).toBe(StatusCodes.CREATED);
      const user = await findUserByEmail(payload.email as string);
      if (!user) {
        throw new Error(`User does not exist.`);
      }
      assert.calledOnceWithExactly(sendWelcomeMailStub, {
        name: user.name,
        email: user.email
      });
    });

    it(`should send email verification email when the user is registered`, async () => {
      const payload = getPayload();
      const { status } = await makeRegisterRequest(payload);

      expect(status).toBe(StatusCodes.CREATED);
      const user = await findUserByEmail(payload.email as string);
      if (!user) {
        throw new Error(`User does not exist.`);
      }
      const verificationToken = await VerificationTokenModel.findOne({
        user: user.id
      });
      if (!verificationToken) {
        throw new Error(`Verification token does not exist.`);
      }
      const expectedVerificationLink = encodeURI(
        `${config.app.feUrl}/auth/verify-email?token=${verificationToken.token}&email=${user.email}`
      );
      assert.calledOnceWithExactly(
        sendVerifyEmailMailStub,
        {
          name: user.name,
          email: user.email
        },
        expectedVerificationLink
      );
    });

    const testRequestData: InputValidationTestData[] = [
      {
        field: `name`,
        value: ``,
        expectedError: `Name is required.`
      },
      {
        field: `email`,
        value: ``,
        expectedError: `Email is required.`
      },
      {
        field: `email`,
        value: faker.datatype.uuid(),
        expectedError: `Email format is invalid.`
      },
      {
        field: `password`,
        value: ``,
        expectedError: `Password is required.`
      },
      ...getPasswordValidationTestData()
    ];
    describe.each(testRequestData)(`Validate input value`, (fieldData) => {
      it(`should fail validation when ${fieldData.field} field's value is "${fieldData.value}"`, async () => {
        const { body, status } = await makeRegisterRequest({
          [fieldData.field]: fieldData.value
        });

        expect(status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
        assertHasValidationError(
          body,
          fieldData.field,
          fieldData.expectedError
        );
      });
    });

    it(`should fail validation when the email has already been taken`, async () => {
      const user = await createTestUser();
      const { body, status } = await makeRegisterRequest(
        getPayload({
          email: user.email
        })
      );

      expect(status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      assertHasValidationError(body, `email`, `Email has already been taken.`);
    });

    const getPayload = (
      data: Partial<RegisterPayload> = {}
    ): Partial<RegisterPayload> => {
      const defaultData: RegisterPayload = {
        name: faker.name.fullName(),
        email: faker.internet.email(),
        password: USER_PASSWORD
      };

      return {
        ...defaultData,
        ...data
      };
    };
  });
});

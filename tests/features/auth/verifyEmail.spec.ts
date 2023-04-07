import { DocumentType } from '@typegoose/typegoose';
import { faker } from '@faker-js/faker';
import { StatusCodes } from '@men-mvc/essentials';
import moment from 'moment';
import { withMockDate, withApplication } from '../../testUtilities';
import { createTestVerificationToken } from '../../factories/verificationTokenFactory';
import { User } from '../../../src/models/user';
import { makeVerifyEmailRequest } from '../requests';
import {
  VerificationToken,
  VerificationTokenModel
} from '../../../src/models/verificationToken';
import { findUserById } from '../../../src/services/userService';
import { createTestUser } from '../../factories/userFactory';
import { InputValidationTestData } from '../../types';
import { assertResponseHasValidationError } from '../../assertions';
import { VerificationTokenType } from '../../../src/types';

describe(`Auth Route - Verify Email`, () => {
  withApplication();
  withMockDate();

  describe(`PUT /api/auth/verify-email`, () => {
    it(`should mark verification token as used when the email is verified`, async () => {
      let verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.VERIFY_EMAIL
      });
      expect(verificationToken.verifiedAt).toBeUndefined();
      const user = (await verificationToken.getUser()) as DocumentType<User>;
      const { status } = await makeVerifyEmailRequest({
        email: user.email,
        token: verificationToken.token
      });

      expect(status).toBe(StatusCodes.NO_CONTENT);
      verificationToken = (await VerificationTokenModel.findById(
        verificationToken.id
      )) as DocumentType<VerificationToken>;
      expect((verificationToken.verifiedAt as Date).getTime()).toBe(
        new Date().getTime()
      );
    });

    it(`should set user.verifiedAt with current datetime when the email is verified`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.VERIFY_EMAIL
      });
      let user = (await verificationToken.getUser()) as DocumentType<User>;
      expect(user.emailVerifiedAt).toBeUndefined();
      const { status } = await makeVerifyEmailRequest({
        email: user.email,
        token: verificationToken.token
      });

      expect(status).toBe(StatusCodes.NO_CONTENT);
      user = (await findUserById(user.id)) as DocumentType<User>;
      expect((user.emailVerifiedAt as Date).getTime()).toBe(
        new Date().getTime()
      );
    });

    it(`should return error when the token does not exist`, async () => {
      const user = await createTestUser();
      const { status } = await makeVerifyEmailRequest({
        email: user.email,
        token: faker.datatype.uuid()
      });

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    it(`should return error when the token type is wrong`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.PASSWORD_RESET
      });
      const user = (await verificationToken.getUser()) as DocumentType<User>;
      const { status } = await makeVerifyEmailRequest({
        email: user.email,
        token: verificationToken.token
      });

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    it(`should return error when the token is expired`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.VERIFY_EMAIL,
        expiresAt: moment().subtract(20, 'seconds').toDate()
      });
      const user = (await verificationToken.getUser()) as DocumentType<User>;
      const { status } = await makeVerifyEmailRequest({
        email: user.email,
        token: verificationToken.token
      });

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    it(`should return error when the token belongs to different user`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.VERIFY_EMAIL,
        expiresAt: moment().add(20, 'hours').toDate()
      });
      const differentUser = await createTestUser();
      const { status } = await makeVerifyEmailRequest({
        email: differentUser.email,
        token: verificationToken.token
      });

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    it(`should return error when the token is already used`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.VERIFY_EMAIL,
        expiresAt: moment().add(20, 'hours').toDate(),
        verifiedAt: moment().subtract(1, 'day').toDate()
      });
      const user = (await verificationToken.getUser()) as DocumentType<User>;
      const { status } = await makeVerifyEmailRequest({
        email: user.email,
        token: verificationToken.token
      });

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    it(`should return error when the user with the email does not exist`, async () => {
      const verificationToken = await createTestVerificationToken({
        type: VerificationTokenType.VERIFY_EMAIL,
        expiresAt: moment().add(20, 'hours').toDate(),
        verifiedAt: moment().subtract(1, 'day').toDate()
      });
      const { status } = await makeVerifyEmailRequest({
        email: faker.internet.email(),
        token: verificationToken.token
      });

      expect(status).toBe(StatusCodes.BAD_REQUEST);
    });

    const testRequestData: InputValidationTestData[] = [
      {
        field: `token`,
        value: ``,
        expectedError: `Token is required.`
      },
      {
        field: `email`,
        value: ``,
        expectedError: `Email is required.`
      }
    ];
    describe.each(testRequestData)(`Validate input value`, (fieldData) => {
      it(`should fail validation when ${fieldData.field} field's value is "${fieldData.value}"`, async () => {
        const { body, status } = await makeVerifyEmailRequest({
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
  });
});

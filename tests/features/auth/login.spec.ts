import { faker } from '@faker-js/faker';
import { StatusCodes } from '@men-mvc/core';
import { withApplication } from '../../testUtilities';
import { TestValidationRequestItem } from '../../types';
import { createTestUser } from '../../factories/userFactory';
import { verifyAuthToken } from '../../../src/services/authService';
import { makeLoginRequest } from '../../requests';
import { USER_PASSWORD } from '../../globals';
import {
  assertResponseHasValidationError,
  assertUserResponse
} from '../../assertions';

describe(`Auth Route - Login`, () => {
  withApplication();

  describe(`POST /api/auth/login`, () => {
    it(`should generate and return access token when login credentials are correct`, async () => {
      const user = await createTestUser();
      const { body, status } = await makeLoginRequest({
        email: user.email,
        password: USER_PASSWORD
      });

      expect(status).toBe(StatusCodes.OK);
      expect(await verifyAuthToken(body.data.accessToken)).not.toBeNull();
    });

    it(`should return user when the login credentials are correct`, async () => {
      const user = await createTestUser();
      const { body, status } = await makeLoginRequest({
        email: user.email,
        password: USER_PASSWORD
      });

      expect(status).toBe(StatusCodes.OK);
      assertUserResponse(body.data.user, user);
    });

    const testRequestData: TestValidationRequestItem[] = [
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
      }
    ];
    describe.each(testRequestData)(`Validate input value`, (fieldData) => {
      it(`should fail validation when ${fieldData.field} field's value is "${fieldData.value}"`, async () => {
        const { body, status } = await makeLoginRequest({
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

    it(`should return error when the user with the email does not exist`, async () => {
      const { body, status } = await makeLoginRequest({
        email: faker.internet.email(),
        password: USER_PASSWORD
      });

      expect(status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(body.error.message).toBe(`Invalid credentials.`);
    });

    it(`should return error when the password is incorrect`, async () => {
      const user = await createTestUser();
      const { body, status } = await makeLoginRequest({
        email: user.email,
        password: `IncorrectPassword.1234`
      });

      expect(status).toBe(StatusCodes.UNPROCESSABLE_ENTITY);
      expect(body.error.message).toBe(`Invalid credentials.`);
    });
  });
});

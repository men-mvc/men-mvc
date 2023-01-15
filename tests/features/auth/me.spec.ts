import { StatusCodes } from 'http-status-codes';
import { faker } from '@faker-js/faker';
import {
  clearDatabase,
  closeDatabaseConnection,
  initApplication
} from '../../testUtilities';
import { createTestUser } from '../../factories/userFactory';
import { makeLoginRequest, makeMeRequest } from '../../requests';
import { USER_PASSWORD } from '../../globals';
import { assertUserResponse } from '../../assertions';

describe(`Auth Route - Me`, () => {
  beforeAll(async () => {
    await initApplication();
  });
  afterAll(async () => {
    await closeDatabaseConnection();
  });
  afterEach(async () => {
    await clearDatabase();
  });

  describe(`GET /api/auth/me`, () => {
    it(`should return unauthorised error when the access token is missing`, async () => {
      const { body, status } = await makeMeRequest(``);

      expect(status).toBe(StatusCodes.UNAUTHORIZED);
      expect(body.error.message).toBe(`Unauthorised.`);
    });

    it(`should return unauthorised error when the access token is invalid`, async () => {
      const { body, status } = await makeMeRequest(faker.datatype.uuid());

      expect(status).toBe(StatusCodes.UNAUTHORIZED);
      expect(body.error.message).toBe(`Unauthorised.`);
    });

    it(`should return me data when the access token is valid`, async () => {
      const user = await createTestUser();
      const { body: loginBody } = await makeLoginRequest({
        email: user.email,
        password: USER_PASSWORD
      });
      const accessToken: string = loginBody.data.accessToken;
      const { body: meBody, status: meStatus } = await makeMeRequest(
        accessToken
      );

      expect(meStatus).toBe(StatusCodes.OK);
      assertUserResponse(meBody.data, user);
    });
  });
});

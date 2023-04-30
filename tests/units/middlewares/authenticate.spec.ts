import { Response, NextFunction } from '@men-mvc/foundation/lib/express';
import { ErrorResponse, StatusCodes } from '@men-mvc/foundation';
import sinon, { SinonSpy } from 'sinon';
import { faker } from '@faker-js/faker';
import { authenticate } from '../../../src/middlewares';
import { createTestUser } from '../../factories/userFactory';
import { generateAuthToken } from '../../../src/services/authService';
import {
  mockErrorNextFunction,
  mockExpressRequest,
  withApplication
} from '../../testUtilities';
import { UserModel } from '../../../src/models/user';
import { FakeExpressResponse } from '../../types';

const response = new FakeExpressResponse() as Response;
describe(`Authenticate Middleware`, () => {
  withApplication();
  let statusSpy: SinonSpy;
  let jsonSpy: SinonSpy;
  beforeEach(() => {
    statusSpy = sinon.spy(response, `status`);
    jsonSpy = sinon.spy(response, `json`);
  });
  afterEach(() => {
    statusSpy.restore();
    jsonSpy.restore();
  });

  it(`should return unauthorised error when access token is missing`, async () => {
    const request = mockExpressRequest({
      headerValues: {
        Authorization: ``
      }
    });
    const next = mockErrorNextFunction();

    await authenticate(request, response, next);

    sinon.assert.calledOnceWithExactly(statusSpy, StatusCodes.UNAUTHORIZED);
    sinon.assert.calledOnceWithExactly(
      jsonSpy,
      new ErrorResponse({
        message: `Unauthorised.`
      })
    );
  });

  it(`should return unauthorised error when Bearer prefix is missing from the Authorization header`, async () => {
    const user = await createTestUser();
    const accessToken = generateAuthToken(user);
    const request = mockExpressRequest({
      headerValues: {
        Authorization: accessToken
      }
    });
    const next = mockErrorNextFunction();

    await authenticate(request, response, next);
    sinon.assert.calledOnceWithExactly(statusSpy, StatusCodes.UNAUTHORIZED);
    sinon.assert.calledOnceWithExactly(
      jsonSpy,
      new ErrorResponse({
        message: `Unauthorised.`
      })
    );
  });

  it(`should return unauthorized error when the access token is invalid`, async () => {
    const request = mockExpressRequest({
      headerValues: {
        Authorization: `Bearer ${faker.datatype.uuid()}`
      }
    });
    const next = mockErrorNextFunction();

    await authenticate(request, response, next);
    sinon.assert.calledOnceWithExactly(statusSpy, StatusCodes.UNAUTHORIZED);
    sinon.assert.calledOnceWithExactly(
      jsonSpy,
      new ErrorResponse({
        message: `Unauthorised.`
      })
    );
  });

  it(`should return null when the user with the ID in the access token does not exist`, async () => {
    const user = await createTestUser();
    await UserModel.deleteOne({
      _id: user.id
    });
    const accessToken = generateAuthToken(user);
    const request = mockExpressRequest({
      headerValues: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const next = mockErrorNextFunction();

    await authenticate(request, response, next);
    sinon.assert.calledOnceWithExactly(statusSpy, StatusCodes.UNAUTHORIZED);
    sinon.assert.calledOnceWithExactly(
      jsonSpy,
      new ErrorResponse({
        message: `Unauthorised.`
      })
    );
  });

  it(`should invoke next without error when access token is valid`, async () => {
    const user = await createTestUser();
    const accessToken = generateAuthToken(user);
    const request = mockExpressRequest({
      headerValues: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    let nextFuncData: string | undefined = `should-be-undefined`;
    let nextFuncCalled = false;
    const next = ((data: string | undefined) => {
      nextFuncData = data;
      nextFuncCalled = true;
    }) as NextFunction;
    await authenticate(request, response, next);

    sinon.assert.notCalled(jsonSpy);
    sinon.assert.notCalled(statusSpy);
    expect(nextFuncCalled).toBeTruthy();
    expect(nextFuncData).toBeUndefined();
  });

  it(`should set request.authUser with the user data when the access token is valid`, async () => {
    const user = await createTestUser();
    const accessToken = generateAuthToken(user);
    const request = mockExpressRequest({
      headerValues: {
        Authorization: `Bearer ${accessToken}`
      }
    });
    const next = jest.fn() as NextFunction;
    await authenticate(request, response, next);

    expect(request.authUser).not.toBeUndefined();
    expect(request.authUser?.id).toBe(user.id);
    expect(request.authUser?.email).toBe(user.email);
  });
});

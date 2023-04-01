import { Response, NextFunction } from '@men-mvc/essentials/lib/express';
import {
  UploadMaxFileSizeError,
  ErrorResponse,
  ErrorCodes,
  StatusCodes
} from '@men-mvc/essentials';
import { logger } from '@men-mvc/logger';
import sinon, { SinonSpy, SinonStub } from 'sinon';
import { mockErrorNextFunction, mockExpressRequest } from '../../testUtilities';
import { errorHandler } from '../../../src/middlewares/errorHandler';
import { FakeExpressResponse } from '../../types';

const response = new FakeExpressResponse() as Response;
describe(`ErrorHandler Middleware`, () => {
  let statusSpy: SinonSpy;
  let jsonSpy: SinonSpy;
  let logErrorStub: SinonStub;
  beforeEach(() => {
    statusSpy = sinon.spy(response, `status`);
    jsonSpy = sinon.spy(response, `json`);
    logErrorStub = sinon.stub(logger, 'logError');
  });
  afterEach(() => {
    statusSpy.restore();
    jsonSpy.restore();
    logErrorStub.restore();
  });
  it(`should call next function without error when there is no error`, () => {
    let nextFunctionCalled = false;
    const next = (() => {
      nextFunctionCalled = true;
    }) as NextFunction;
    errorHandler(null, mockExpressRequest(), response, next);

    expect(nextFunctionCalled).toBeTruthy();
  });

  it(`should log error when there is an error`, () => {
    const error = new Error(`Something went wrong.`);
    errorHandler(
      error,
      mockExpressRequest(),
      response,
      mockErrorNextFunction()
    );

    sinon.assert.calledOnceWithExactly(logErrorStub, error);
  });

  it(`should return internal server response when there is an error`, () => {
    const error = new Error(`Something went wrong.`);
    errorHandler(
      error,
      mockExpressRequest(),
      response,
      mockErrorNextFunction()
    );

    sinon.assert.calledOnceWithExactly(
      statusSpy,
      StatusCodes.INTERNAL_SERVER_ERROR
    );
    sinon.assert.calledOnceWithExactly(
      jsonSpy,
      new ErrorResponse({
        message: error.message
      })
    );
  });

  it(`should return UploadMaxFileSizeError error when the error type is UploadMaxFileSizeException`, async () => {
    const error = new UploadMaxFileSizeError();
    errorHandler(
      error,
      mockExpressRequest(),
      response,
      mockErrorNextFunction()
    );

    sinon.assert.calledOnceWithExactly(statusSpy, StatusCodes.BAD_REQUEST);
    sinon.assert.calledOnceWithExactly(
      jsonSpy,
      new ErrorResponse({
        message: error.message,
        code: ErrorCodes.UPLOAD_MAX_FILESIZE_LIMIT
      })
    );
  });
});

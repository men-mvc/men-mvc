import {
  express,
  Request,
  Express,
  NextFunction
} from '@men-mvc/core/lib/express';
import { DeepPartial } from '@men-mvc/core';
import { faker } from '@faker-js/faker';
import sinon from 'sinon';
import _ from 'lodash';
import Application from '../src/application';
import { CustomExpressRequest, FakeExpressRequestData } from './types';
import { database } from '../src/database';

// shared variables
let application: Application | null;
let dateNowStub: sinon.SinonStub;

export const initApplication = async (): Promise<Application> => {
  if (!application) {
    const app: Express = express();
    application = new Application(app);
    await application.setUp();
  }
  return application;
};

export const getExpressApp = async (): Promise<Express> => {
  if (!application) {
    application = await initApplication();
  }

  return application.app;
};

export const closeDatabaseConnection = async () => {
  await database.close();
};

export const clearDatabase = async () => {
  await database.drop();
};

export const withApplication = () => {
  beforeAll(async () => {
    await initApplication();
  });
  afterAll(async () => {
    await closeDatabaseConnection();
  });
  afterEach(async () => {
    await clearDatabase();
  });
};

export const mockErrorNextFunction = (): NextFunction => {
  return (() => {
    throw new Error(`Next function was invoked.`);
  }) as NextFunction;
};

export const mockExpressRequest = (
  data: DeepPartial<FakeExpressRequestData> = {}
): CustomExpressRequest => {
  const defaultData: FakeExpressRequestData = {
    headerValues: {
      Authorization: `Bearer ${faker.datatype.uuid()}`
    }
  };
  const finalData: FakeExpressRequestData = _.merge(defaultData, data);

  return {
    header: (field: string) => {
      if (field === `Authorization`) {
        return finalData.headerValues.Authorization;
      }

      return faker.datatype.uuid();
    }
  } as Request;
};

export const mockNow = (now: string | number = '2023-01-28T13:02:04.147Z') => {
  class MockDate extends Date {
    constructor(date?: number | string) {
      if (date) {
        super(date);
      } else {
        // set default now
        super(now);
      }
    }

    static now = () => new Date(now).getTime();
  }

  dateNowStub = sinon.stub(global, 'Date').value(MockDate);
};
export const restoreNowMock = () => {
  if (dateNowStub) {
    dateNowStub.restore();
  }
};

export const getPasswordValidationTestData = (field = `password`) => [
  {
    field,
    value: `Test2in`,
    expectedError: `Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 digit, 1 special character and have at least 8 characters.`
  },
  {
    field,
    value: `TestingTes!`, // no number
    expectedError: `Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 digit, 1 special character and have at least 8 characters.`
  },
  {
    field,
    value: `testing123!`, // no upper-case letter
    expectedError: `Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 digit, 1 special character and have at least 8 characters.`
  },
  {
    field,
    value: `TESTING1234!`, // no small letter
    expectedError: `Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 digit, 1 special character and have at least 8 characters.`
  },
  {
    field,
    value: `Testing12345`, // no special character
    expectedError: `Password must contain at least 1 lowercase letter, 1 uppercase letter, 1 digit, 1 special character and have at least 8 characters.`
  }
];

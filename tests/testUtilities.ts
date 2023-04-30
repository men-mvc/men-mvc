import {
  Request,
  Express,
  NextFunction
} from '@men-mvc/foundation/lib/express';
import { DeepPartial } from '@men-mvc/foundation';
import { faker } from '@faker-js/faker';
import _ from 'lodash';
import { set as setMockDate, reset as resetMockDate } from 'mockdate';
import { Application } from '../src/application';
import { CustomExpressRequest, FakeExpressRequestData } from './types';
import { database } from '../src/database';
import { createApplication } from '../src/server';

// shared variables
let application: Application | null;

export const initApplication = async (): Promise<Application> => {
  if (!application) {
    application = application = await createApplication();
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

export const withMockDate = () => {
  beforeAll(() => {
    setMockDate(new Date().toISOString());
  });

  afterAll(resetMockDate);
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

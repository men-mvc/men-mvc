import { Request } from '@men-mvc/foundation/lib/express';
import { DocumentType } from '@typegoose/typegoose';
import { User } from '../src/models/user';

export type InputValidationTestData = {
  field: string;
  value: string;
  expectedError: string;
};

export interface CustomExpressRequest extends Request {
  authUser?: DocumentType<User>;
}
export type FakeExpressRequestData = {
  headerValues: {
    Authorization: string;
  };
  authUser?: DocumentType<User>;
};

export class FakeExpressResponse {
  status = (status: number) => {
    jest.fn().mockReturnValue(status); // only faking a function to make use of status parameter. but this has no impact on the tests.
    return this;
  };
  json = (data: object | string | number) => {
    jest.fn().mockReturnValue(data); // only faking a function to make use of data parameter. but this has no impact on the tests.
  };
}

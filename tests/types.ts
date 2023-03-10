import { Request } from '@men-mvc/core/lib/express';
import { DocumentType } from '@typegoose/typegoose';
import { User } from '../src/models/user';

export type TestValidationRequestItem = {
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

export type RegisterPayload = {
  name: string;
  email: string;
  password: string;
};

export type LoginPayload = {
  email: string;
  password: string;
};

export type ResetPasswordPayload = {
  email: string;
  token: string;
  newPassword: string;
  passwordConfirmation: string;
};

export type VerifyEmailPayload = {
  email: string;
  token: string;
};

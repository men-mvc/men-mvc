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
    return this;
  };
  json = (data: object | string | number) => {};
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

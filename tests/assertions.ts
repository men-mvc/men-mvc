import { DocumentType } from '@typegoose/typegoose';
import { ValidationErrorResponse } from '@men-mvc/core';
import { User } from '../src/models/user';

export const assertResponseHasValidationError = (
  response: ValidationErrorResponse,
  field: string,
  expectedError: string
) => {
    if (
        !response.error.details ||
        Object.keys(response.error.details).length < 1
    ) {
        throw new Error(`Validation errors missing.`);
    }
    expect(
        Object.keys(response.error.details).some(
            (key) =>
                response.error.details &&
                key === field &&
                response.error.details[key] === expectedError
        ),
        `could not find validation error '${expectedError}' in the response.`,
        {
            showPrefix: false,
            showMatcherMessage: false
        }
    ).toBeTruthy();
};

export const assertUserResponse = (
  responseUser: {
    _id: string;
    name: string;
    email: string;
    emailVerifiedAt: string;
    isActive: boolean;
    password?: string;
  },
  userModel: DocumentType<User>
) => {
  expect(responseUser._id).toBe(userModel.id);
  expect(responseUser.name).toBe(userModel.name);
  expect(responseUser.email).toBe(userModel.email);
  if (responseUser.emailVerifiedAt) {
    expect(new Date(responseUser.emailVerifiedAt).getTime()).toBe(
      (userModel.emailVerifiedAt as Date).getTime()
    );
  } else {
    expect(responseUser.emailVerifiedAt).toBe(userModel.emailVerifiedAt);
  }
  expect(responseUser.isActive).toBe(userModel.isActive);
  expect(responseUser.password).toBeUndefined();
};

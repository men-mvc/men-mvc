import { DocumentType } from '@typegoose/typegoose';
import {
  emptyResponse,
  errorResponse,
  successResponse,
  validateRequest,
  validateRequestAsync
} from '@men-mvc/core';
import { Request, Response } from '@men-mvc/core/lib/express';
import {
  changePassword,
  checkIfVerificationTokenValid,
  generateEmailVerificationLink,
  generatePasswordResetLink,
  loginUser,
  registerUser,
  useVerificationToken,
  verifyEmail as verifyUserEmail
} from '../services/authService';
import { findUserByEmail } from '../services/userService';
import {
  sendPasswordResetMail,
  sendVerifyEmailMail
} from '../services/mailService';
import { User } from '../models/user';
import {
  loginValSchema,
  registerValSchema,
  requestPasswordResetValSchema,
  resendVerifyEmailLinkValSchema,
  resetPasswordValSchema,
  verifyEmailValSchema
} from '../validation/authSchema';
import { VerificationTokenType } from '../types';

export const register = async (req: Request, res: Response) => {
  await validateRequestAsync(registerValSchema, req.body);
  const user = await registerUser(req.body);

  return successResponse(res, user.toJSON(), 201);
};

export const login = async (req: Request, res: Response) => {
  validateRequest(loginValSchema, req.body);
  const user = await findUserByEmail(req.body.email);
  if (!user) {
    return loginInvalidCredentialsResponse(res);
  }
  const accessToken = await loginUser(user, req.body.password);
  if (!accessToken) {
    return loginInvalidCredentialsResponse(res);
  }

  return successResponse(res, constructLoginResponse(accessToken, user));
};

export const resendVerifyEmailLink = async (req: Request, res: Response) => {
  validateRequest(resendVerifyEmailLinkValSchema, req.body);
  const user = await findUserByEmail(req.body.email);
  if (!user) {
    return accountDoesNotExistResponse(res);
  }
  const verificationLink = await generateEmailVerificationLink(user);
  await sendVerifyEmailMail(
    {
      email: user.email,
      name: user.name
    },
    verificationLink
  );

  return emptyResponse(res);
};

export const verifyEmail = async (req: Request, res: Response) => {
  validateRequest(verifyEmailValSchema, req.body);
  const user = await findUserByEmail(req.body.email);
  if (!user) {
    return accountDoesNotExistResponse(res);
  }
  if (
    !(await checkIfVerificationTokenValid(
      req.body.token,
      VerificationTokenType.VERIFY_EMAIL,
      user
    ))
  ) {
    return emptyResponse(res, 400);
  }
  await verifyUserEmail(user, req.body.token);

  return emptyResponse(res);
};

export const requestPasswordReset = async (req: Request, res: Response) => {
  validateRequest(requestPasswordResetValSchema, req.body);
  const user = await findUserByEmail(req.body.email);
  if (!user) {
    return accountDoesNotExistResponse(res);
  }
  const passwordResetLink = await generatePasswordResetLink(user);
  await sendPasswordResetMail(
    {
      name: user.name,
      email: user.email
    },
    passwordResetLink
  );

  return emptyResponse(res);
};

export const resetPassword = async (req: Request, res: Response) => {
  validateRequest(resetPasswordValSchema, req.body);
  const user = await findUserByEmail(req.body.email);
  if (!user) {
    return accountDoesNotExistResponse(res);
  }
  if (
    !(await checkIfVerificationTokenValid(
      req.body.token,
      VerificationTokenType.PASSWORD_RESET,
      user
    ))
  ) {
    return emptyResponse(res, 400);
  }
  await changePassword(user, req.body.newPassword);
  await useVerificationToken(req.body.token);

  return emptyResponse(res);
};

export const me = (req: Request, res: Response) =>
  successResponse(res, req.authUser);

const constructLoginResponse = (
  accessToken: string,
  user: DocumentType<User>
): {
  accessToken: string;
  user: DocumentType<User>;
} => ({
  user,
  accessToken
});

const accountDoesNotExistResponse = (res: Response) =>
  errorResponse(res, `Account does not exist.`,  400);

const loginInvalidCredentialsResponse = (res: Response) =>
  errorResponse(res, `Invalid credentials.`, 422);

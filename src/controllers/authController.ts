import {
  emptyResponse,
  errorResponse,
  successResponse,
  StatusCodes,
  ValidateRequest,
  ValidateRequestAsync,
} from '@men-mvc/core';
import { Request, Response } from '@men-mvc/core/lib/express';
import { DocumentType } from '@typegoose/typegoose';
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

export class AuthController {
  @ValidateRequestAsync(registerValSchema)
  public async register(req: Request, res: Response) {
    const user = await registerUser(req.body);

    return successResponse(res, user.toJSON(), StatusCodes.CREATED);
  }

  @ValidateRequest(loginValSchema)
  public async login(req: Request, res: Response) {
    const user = await findUserByEmail(req.body.email);
    if (!user) {
      return this.loginInvalidCredentialsResponse(res);
    }
    const accessToken = await loginUser(user, req.body.password);
    if (!accessToken) {
      return this.loginInvalidCredentialsResponse(res);
    }

    return successResponse(res, this.constructLoginResponse(accessToken, user));
  }

  @ValidateRequest(resendVerifyEmailLinkValSchema)
  public async resendVerifyEmailLink(req: Request, res: Response) {
    const user = await findUserByEmail(req.body.email);
    if (!user) {
      return this.accountDoesNotExistResponse(res);
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
  }

  @ValidateRequest(verifyEmailValSchema)
  public async verifyEmail(req: Request, res: Response) {
    const user = await findUserByEmail(req.body.email);
    if (!user) {
      return this.accountDoesNotExistResponse(res);
    }
    if (
      !(await checkIfVerificationTokenValid(
        req.body.token,
        VerificationTokenType.VERIFY_EMAIL,
        user
      ))
    ) {
      return emptyResponse(res, StatusCodes.BAD_REQUEST);
    }
    await verifyUserEmail(user, req.body.token);

    return emptyResponse(res);
  }

  @ValidateRequest(requestPasswordResetValSchema)
  public async requestPasswordReset(req: Request, res: Response) {
    const user = await findUserByEmail(req.body.email);
    if (!user) {
      return this.accountDoesNotExistResponse(res);
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
  }

  @ValidateRequest(resetPasswordValSchema)
  public async resetPassword(req: Request, res: Response) {
    const user = await findUserByEmail(req.body.email);
    if (!user) {
      return this.accountDoesNotExistResponse(res);
    }
    if (
      !(await checkIfVerificationTokenValid(
        req.body.token,
        VerificationTokenType.PASSWORD_RESET,
        user
      ))
    ) {
      return emptyResponse(res, StatusCodes.BAD_REQUEST);
    }
    await changePassword(user, req.body.newPassword);
    await useVerificationToken(req.body.token);

    return emptyResponse(res);
  }

  public me(req: Request, res: Response) {
    return successResponse(res, req.authUser);
  }

  private constructLoginResponse(
    accessToken: string,
    user: DocumentType<User>
  ): {
    accessToken: string;
    user: DocumentType<User>;
  } {
    return {
      user,
      accessToken
    };
  }

  private accountDoesNotExistResponse(res: Response) {
    return errorResponse(
      res,
      `Account does not exist.`,
      StatusCodes.BAD_REQUEST
    );
  }

  private loginInvalidCredentialsResponse(res: Response) {
    return errorResponse(
      res,
      `Invalid credentials.`,
      StatusCodes.UNPROCESSABLE_ENTITY
    );
  }
}

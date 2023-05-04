import {
  emptyResponse,
  errorResponse,
  successResponse,
  StatusCodes,
  ValidateRequest,
  ValidateRequestAsync
} from '@men-mvc/foundation';
import { Request, Response } from '@men-mvc/foundation/lib/express';
import { Container, Service } from 'typedi';
import { DocumentType } from '@typegoose/typegoose';
import { AuthService } from '../services/authService';
import { UserService } from '../services/userService';
import { MailService } from '../services/mailService';
import { User } from '../models/user';
import {
  loginSchema,
  RegisterValidator,
  requestPasswordResetSchema,
  resendVerifyEmailLinkSchema,
  resetPasswordSchema,
  verifyEmailSchema
} from '../requests/validation/authSchema';
import { VerificationTokenType } from '../types';

@Service()
export class AuthController {
  static token = 'auth-controller';

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly mailService: MailService
  ) {}

  @ValidateRequestAsync(Container.get(RegisterValidator))
  public async register(req: Request, res: Response) {
    const user = await this.authService.registerUser(req.body);

    return successResponse(res, user.toJSON(), StatusCodes.CREATED);
  }

  @ValidateRequest(loginSchema)
  public async login(req: Request, res: Response) {
    const user = await this.userService.findUserByEmail(req.body.email);
    if (!user) {
      return this.loginInvalidCredentialsResponse(res);
    }
    const accessToken = await this.authService.loginUser(
      user,
      req.body.password
    );
    if (!accessToken) {
      return this.loginInvalidCredentialsResponse(res);
    }

    return successResponse(res, this.constructLoginResponse(accessToken, user));
  }

  @ValidateRequest(resendVerifyEmailLinkSchema)
  public async resendVerifyEmailLink(req: Request, res: Response) {
    const user = await this.userService.findUserByEmail(req.body.email);
    if (!user) {
      return this.accountDoesNotExistResponse(res);
    }
    const verificationLink =
      await this.authService.generateEmailVerificationLink(user);
    await this.mailService.sendVerifyEmailMail(
      {
        email: user.email,
        name: user.name
      },
      verificationLink
    );

    return emptyResponse(res);
  }

  @ValidateRequest(verifyEmailSchema)
  public async verifyEmail(req: Request, res: Response) {
    const user = await this.userService.findUserByEmail(req.body.email);
    if (!user) {
      return this.accountDoesNotExistResponse(res);
    }
    if (
      !(await this.authService.checkIfVerificationTokenValid(
        req.body.token,
        VerificationTokenType.VERIFY_EMAIL,
        user
      ))
    ) {
      return emptyResponse(res, StatusCodes.BAD_REQUEST);
    }
    await this.authService.verifyEmail(user, req.body.token);

    return emptyResponse(res);
  }

  @ValidateRequest(requestPasswordResetSchema)
  public async requestPasswordReset(req: Request, res: Response) {
    const user = await this.userService.findUserByEmail(req.body.email);
    if (!user) {
      return this.accountDoesNotExistResponse(res);
    }
    const passwordResetLink = await this.authService.generatePasswordResetLink(
      user
    );
    await this.mailService.sendPasswordResetMail(
      {
        name: user.name,
        email: user.email
      },
      passwordResetLink
    );

    return emptyResponse(res);
  }

  @ValidateRequest(resetPasswordSchema)
  public async resetPassword(req: Request, res: Response) {
    const user = await this.userService.findUserByEmail(req.body.email);
    if (!user) {
      return this.accountDoesNotExistResponse(res);
    }
    if (
      !(await this.authService.checkIfVerificationTokenValid(
        req.body.token,
        VerificationTokenType.PASSWORD_RESET,
        user
      ))
    ) {
      return emptyResponse(res, StatusCodes.BAD_REQUEST);
    }
    await this.authService.changePassword(user, req.body.newPassword);
    await this.authService.useVerificationToken(req.body.token);

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

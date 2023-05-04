import { DocumentType } from '@typegoose/typegoose';
import {
  generateUuid,
  hashPassword,
  validatePassword
} from '@men-mvc/foundation';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import moment from 'moment';
import { Service } from 'typedi';
import { config } from '../config';
import { AuthTokenPayload, VerificationTokenType } from '../types';
import { User, UserModel } from '../models/user';
import {
  VerificationToken,
  VerificationTokenModel
} from '../models/verificationToken';
import { UserService } from './userService';
import { MailService } from './mailService';

@Service()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly mailService: MailService
  ) {}

  public generateAuthToken(user: DocumentType<User>): string {
    const payload: AuthTokenPayload = {
      id: user.id,
      name: user.name,
      email: user.email
    };
    return jwt.sign(payload, config.auth.secret, {
      expiresIn: config.auth.tokenExpiresIn
    });
  }

  public async verifyAuthToken(
    token: string
  ): Promise<null | AuthTokenPayload> {
    try {
      const payload = await jwt.verify(token, config.auth.secret);

      return payload ? (payload as AuthTokenPayload) : null;
    } catch (e) {
      return null;
    }
  }

  public async createVerificationToken(data: {
    token: string;
    type: VerificationTokenType;
    expiresAt: Date;
    userId: string;
  }): Promise<DocumentType<VerificationToken>> {
    return VerificationTokenModel.create({
      ...data,
      createdAt: Date.now(),
      user: data.userId
    });
  }

  public generateVerificationToken(): string {
    return `${generateUuid()}-${crypto.randomBytes(32).toString('hex')}`;
  }

  public async generatePasswordResetVerificationToken(
    user: DocumentType<User>
  ): Promise<VerificationToken> {
    const expiresAt = moment()
      .add(config.auth.passwordResetLinkDuration, 'seconds')
      .toDate();
    const token = this.generateVerificationToken();
    return await this.createVerificationToken({
      token,
      type: VerificationTokenType.PASSWORD_RESET,
      expiresAt,
      userId: user.id
    });
  }

  public async generateVerifyEmailVerificationToken(
    user: DocumentType<User>
  ): Promise<VerificationToken> {
    const expiresAt = moment()
      .add(config.auth.emailVerificationLinkDuration, 'seconds')
      .toDate();
    const token = this.generateVerificationToken();
    return await this.createVerificationToken({
      token,
      type: VerificationTokenType.VERIFY_EMAIL,
      expiresAt,
      userId: user.id
    });
  }

  public async generatePasswordResetLink(
    user: DocumentType<User>
  ): Promise<string> {
    const token = await this.generatePasswordResetVerificationToken(user);

    return encodeURI(
      `${config.app.feUrl}/auth/reset-password?token=${token.token}&email=${user.email}`
    );
  }

  public async generateEmailVerificationLink(
    user: DocumentType<User>
  ): Promise<string> {
    const token = await this.generateVerifyEmailVerificationToken(user);

    return encodeURI(
      `${config.app.feUrl}/auth/verify-email?token=${token.token}&email=${user.email}`
    );
  }

  public async registerUser(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<DocumentType<User>> {
    const password = await hashPassword(data.password);
    const user = await this.userService.createUser({
      name: data.name,
      email: data.email,
      password,
      emailVerifiedAt: null,
      isActive: true
    });
    await this.mailService.sendWelcomeMail({
      name: user.name,
      email: user.email
    });
    const emailVerificationLink = await this.generateEmailVerificationLink(
      user
    );
    await this.mailService.sendVerifyEmailMail(
      {
        name: user.name,
        email: user.email
      },
      emailVerificationLink
    );

    return user;
  }

  /**
   * @returns - access token upon successful login otherwise null
   */
  public async loginUser(
    user: DocumentType<User>,
    password: string
  ): Promise<string | null> {
    if (!user.password) {
      return null;
    }
    if (!(await validatePassword(password, user.password))) {
      return null;
    }

    return this.generateAuthToken(user);
  }

  public async changePassword(
    user: DocumentType<User>,
    newPassword: string
  ): Promise<void> {
    const passwordHash = await hashPassword(newPassword);

    await UserModel.findByIdAndUpdate(user.id, {
      $set: {
        password: passwordHash
      }
    });
  }

  public async useVerificationToken(token: string): Promise<void> {
    await VerificationTokenModel.findOneAndUpdate(
      {
        token,
        verifiedAt: null
      },
      {
        $set: {
          verifiedAt: Date.now()
        }
      }
    );
  }

  public async checkIfVerificationTokenValid(
    token: string,
    type: VerificationTokenType,
    user: DocumentType<User>
  ): Promise<boolean> {
    const tokenModel: VerificationToken | null =
      await VerificationTokenModel.findOne({
        token,
        user: user.id,
        type
      });
    if (!tokenModel) {
      return false;
    }
    const now: Date = new Date();
    if (now.getTime() < tokenModel.expiresAt.getTime()) {
      // also check if token is already verified
      return !tokenModel.verifiedAt;
    }

    // token already expired
    return false;
  }

  // token should be validated before calling this function as this function does not validate the token
  public async verifyEmail(
    user: DocumentType<User>,
    token: string
  ): Promise<void> {
    await UserModel.findByIdAndUpdate(user.id, {
      $set: {
        emailVerifiedAt: Date.now()
      }
    });
    await this.useVerificationToken(token);
  }
}

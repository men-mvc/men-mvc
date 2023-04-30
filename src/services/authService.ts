import { DocumentType } from '@typegoose/typegoose';
import {
  generateUuid,
  hashPassword,
  validatePassword
} from '@men-mvc/foundation';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import moment from 'moment';
import { config } from '../config';
import { AuthTokenPayload, VerificationTokenType } from '../types';
import { User, UserModel } from '../models/user';
import {
  VerificationToken,
  VerificationTokenModel
} from '../models/verificationToken';
import { createUser } from './userService';
import { sendVerifyEmailMail, sendWelcomeMail } from './mailService';

export const generateAuthToken = (user: DocumentType<User>): string => {
  const payload: AuthTokenPayload = {
    id: user.id,
    name: user.name,
    email: user.email
  };
  return jwt.sign(payload, config.auth.secret, {
    expiresIn: config.auth.tokenExpiresIn
  });
};

export const verifyAuthToken = async (
  token: string
): Promise<null | AuthTokenPayload> => {
  try {
    const payload = await jwt.verify(token, config.auth.secret);

    return payload ? (payload as AuthTokenPayload) : null;
  } catch (e) {
    return null;
  }
};

export const createVerificationToken = async (data: {
  token: string;
  type: VerificationTokenType;
  expiresAt: Date;
  userId: string;
}): Promise<DocumentType<VerificationToken>> => {
  return VerificationTokenModel.create({
    ...data,
    createdAt: Date.now(),
    user: data.userId
  });
};

const generateVerificationToken = (): string =>
  `${generateUuid()}-${crypto.randomBytes(32).toString('hex')}`;

const generatePasswordResetVerificationToken = async (
  user: DocumentType<User>
): Promise<VerificationToken> => {
  const expiresAt = moment()
    .add(config.auth.passwordResetLinkDuration, 'seconds')
    .toDate();
  const token = generateVerificationToken();
  return await createVerificationToken({
    token,
    type: VerificationTokenType.PASSWORD_RESET,
    expiresAt,
    userId: user.id
  });
};

const generateVerifyEmailVerificationToken = async (
  user: DocumentType<User>
): Promise<VerificationToken> => {
  const expiresAt = moment()
    .add(config.auth.emailVerificationLinkDuration, 'seconds')
    .toDate();
  const token = generateVerificationToken();
  return await createVerificationToken({
    token,
    type: VerificationTokenType.VERIFY_EMAIL,
    expiresAt,
    userId: user.id
  });
};

export const generatePasswordResetLink = async (
  user: DocumentType<User>
): Promise<string> => {
  const token = await generatePasswordResetVerificationToken(user);

  return encodeURI(
    `${config.app.feUrl}/auth/reset-password?token=${token.token}&email=${user.email}`
  );
};

export const generateEmailVerificationLink = async (
  user: DocumentType<User>
): Promise<string> => {
  const token = await generateVerifyEmailVerificationToken(user);

  return encodeURI(
    `${config.app.feUrl}/auth/verify-email?token=${token.token}&email=${user.email}`
  );
};

export const registerUser = async (data: {
  name: string;
  email: string;
  password: string;
}): Promise<DocumentType<User>> => {
  const password = await hashPassword(data.password);
  const user = await createUser({
    name: data.name,
    email: data.email,
    password,
    emailVerifiedAt: null,
    isActive: true
  });
  await sendWelcomeMail({
    name: user.name,
    email: user.email
  });
  const emailVerificationLink = await generateEmailVerificationLink(user);
  await sendVerifyEmailMail(
    {
      name: user.name,
      email: user.email
    },
    emailVerificationLink
  );

  return user;
};

// returns access token. Returns null if the credentials are invalid
export const loginUser = async (
  user: DocumentType<User>,
  password: string
): Promise<string | null> => {
  if (!user.password) {
    return null;
  }
  if (!(await validatePassword(password, user.password))) {
    return null;
  }

  return generateAuthToken(user);
};

export const changePassword = async (
  user: DocumentType<User>,
  newPassword: string
): Promise<void> => {
  const passwordHash = await hashPassword(newPassword);

  await UserModel.findByIdAndUpdate(user.id, {
    $set: {
      password: passwordHash
    }
  });
};

export const useVerificationToken = async (token: string): Promise<void> => {
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
};

export const checkIfVerificationTokenValid = async (
  token: string,
  type: VerificationTokenType,
  user: DocumentType<User>
): Promise<boolean> => {
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
};

// token should be validated before calling this function as this function does not validate the token
export const verifyEmail = async (user: DocumentType<User>, token: string) => {
  await UserModel.findByIdAndUpdate(user.id, {
    $set: {
      emailVerifiedAt: Date.now()
    }
  });
  await useVerificationToken(token);
};

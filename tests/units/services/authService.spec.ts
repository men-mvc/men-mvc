import { validatePassword, hashPassword } from '@men-mvc/foundation';
import { DocumentType } from '@typegoose/typegoose';
import jwt from 'jsonwebtoken';
import moment from 'moment';
import { faker } from '@faker-js/faker';
import sinon, { SinonStub } from 'sinon';
import { config } from '../../../src/config';
import { User } from '../../../src/models/user';
import { withMockDate, withApplication } from '../../testUtilities';
import { createTestUser } from '../../factories/userFactory';
import {
  VerificationToken,
  VerificationTokenModel
} from '../../../src/models/verificationToken';
import { AuthService } from '../../../src/services/authService';
import { UserService } from '../../../src/services/userService';
import { MailService } from '../../../src/services/mailService';
import { createTestVerificationToken } from '../../factories/verificationTokenFactory';
import { USER_PASSWORD } from '../../globals';
import { AuthTokenPayload } from '../../../src/types';
import { getRandomVerificationTokenType } from '../../factories/verificationTokenFactory';
import { Container } from 'typedi';

describe(`AuthService`, () => {
  withApplication();
  withMockDate();
  const userService = Container.get(UserService);
  const authService = Container.get(AuthService);
  const mailService = Container.get(MailService);

  let sendWelcomeMailStub: SinonStub;
  let sendVerifyEmailMailStub: SinonStub;
  beforeEach(async () => {
    sendWelcomeMailStub = sinon.stub(mailService, `sendWelcomeMail`);
    sendVerifyEmailMailStub = sinon.stub(mailService, `sendVerifyEmailMail`);
  });
  afterEach(async () => {
    sendWelcomeMailStub.restore();
    sendVerifyEmailMailStub.restore();
  });

  it(`generates auth token in correct format`, async () => {
    const user: DocumentType<User> = await createTestUser();
    const accessToken = authService.generateAuthToken(user);
    const decodedToken = jwt.decode(accessToken) as AuthTokenPayload;

    expect(decodedToken).not.toBeNull();
    expect(decodedToken.id).toBe(user.id);
    expect(decodedToken.name).toBe(user.name);
    expect(decodedToken.email).toBe(user.email);
  });

  it(`creates verification token`, async () => {
    const user = await createTestUser();
    const data = {
      token: faker.datatype.uuid(),
      type: getRandomVerificationTokenType(),
      expiresAt: moment().add(2, 'days').toDate(),
      userId: user.id
    };
    const token = await authService.createVerificationToken(data);

    expect(token).not.toBeNull();
    expect(token.token).toBe(data.token);
    expect(token.user.toString()).toBe(data.userId);
    const createdUser = await token.getUser();
    expect(createdUser).not.toBeNull();
    if (!createdUser) {
      throw new Error('User does not exist.');
    }
    expect(createdUser.name).toBe(user.name);
    expect(createdUser.email).toBe(user.email);
    expect(moment(createdUser.createdAt).milliseconds()).toBe(
      moment().milliseconds()
    );
  });

  it(`should generate password-reset link in correct format creating verification token`, async () => {
    const user = await createTestUser();
    const actualLink = await authService.generatePasswordResetLink(user);
    const verificationToken = await VerificationTokenModel.findOne({
      user: user.id
    });
    if (!verificationToken) {
      throw new Error(`Verification token cannot be null`);
    }
    const expectedLink = encodeURI(
      `${config.app.feUrl}/auth/reset-password?token=${verificationToken.token}&email=${user.email}`
    );
    expect(actualLink).toBe(expectedLink);
  });

  it(`should generate email verification link in correct format creating verification token`, async () => {
    const user = await createTestUser();
    const actualLink = await authService.generateEmailVerificationLink(user);
    const verificationToken = await VerificationTokenModel.findOne({
      user: user.id
    });
    if (!verificationToken) {
      throw new Error(`Verification token cannot be null`);
    }
    const expectedLink = encodeURI(
      `${config.app.feUrl}/auth/verify-email?token=${verificationToken.token}&email=${user.email}`
    );
    expect(actualLink).toBe(expectedLink);
  });

  it(`should hash the plain text password`, async () => {
    const plainText = `Test.1234`;
    const hash = await hashPassword(plainText);

    expect(plainText).not.toBe(hash);
    expect(hash.length).toBe(60);
  });

  it(`should return true when passwords are the same`, async () => {
    const hash = await hashPassword(`Testing.123`);
    const result = await validatePassword(`Testing.123`, hash);

    expect(result).toBeTruthy();
  });

  it(`should return false when passwords are different`, async () => {
    const hash = await hashPassword(`Testing.123`);
    const result = await validatePassword(USER_PASSWORD, hash);

    expect(result).toBeFalsy();
  });

  it(`should create an active user with unverified email and hash password when registration is successful`, async () => {
    const data = getRegisterUserParams();
    await authService.registerUser(data);
    const user = await userService.findUserByEmail(data.email);

    expect(user).not.toBeNull();
    if (!user) {
      throw new Error(`User was not created.`);
    }
    expect(user.email).toBe(data.email.toLowerCase());
    expect(user.name).toBe(data.name);
    expect(user.emailVerifiedAt).toBeNull();
    expect(user.isActive).toBeTruthy();
    const passwordHashedCorrectly = await validatePassword(
      data.password,
      user.password as string
    );
    expect(passwordHashedCorrectly).toBeTruthy();
  });

  it(`should return the registered user model`, async () => {
    const data = getRegisterUserParams();
    const user = await authService.registerUser(data);

    expect(user.email).toBe(data.email.toLowerCase());
    expect(user.name).toBe(data.name);
  });

  it(`should send welcome email after user is created`, async () => {
    const data = getRegisterUserParams();
    const user = await authService.registerUser(data);

    sinon.assert.calledOnceWithExactly(sendWelcomeMailStub, {
      name: user.name,
      email: user.email
    });
  });

  it(`should send email verification email after user is created`, async () => {
    const data = getRegisterUserParams();
    const user = await authService.registerUser(data);
    const verificationToken = await VerificationTokenModel.findOne({
      user: user.id
    });

    if (!verificationToken) {
      throw new Error(`Verification token does not exist.`);
    }
    const expectedVerificationLink = encodeURI(
      `${config.app.feUrl}/auth/verify-email?token=${verificationToken.token}&email=${user.email}`
    );
    sinon.assert.calledOnceWithExactly(
      sendVerifyEmailMailStub,
      {
        name: user.name,
        email: user.email
      },
      expectedVerificationLink
    );
  });

  it(`should return null when the user does not have password`, async () => {
    const user = await createTestUser({
      password: ``
    });
    const result = await authService.loginUser(user, ``);

    expect(result).toBeNull();
  });

  it(`should return null when the passwords do not match`, async () => {
    const user = await createTestUser({
      password: `Testing.123`
    });
    const result = await authService.loginUser(user, `Testing.12`);

    expect(result).toBeNull();
  });

  it(`should generate and return access token when the password is correct for user`, async () => {
    const user = await createTestUser();
    const result = await authService.loginUser(user, USER_PASSWORD);

    expect(result).not.toBeNull();
    if (!result) {
      throw new Error(`Access token was not generated`);
    }
    expect(await authService.verifyAuthToken(result)).toBeTruthy();
  });

  it(`should update existing password with new password hash`, async () => {
    const oldPassword = `Testing.123`;
    const newPassword = `NewPassword.123`;
    let user: DocumentType<User> | null = await createTestUser({
      password: oldPassword
    });
    await authService.changePassword(user, newPassword);
    user = await userService.findUserByEmail(user.email);
    if (!user) {
      throw new Error(`User does not exist.`);
    }
    expect(
      await validatePassword(newPassword, user.password as string)
    ).toBeTruthy();
  });

  it(`should set verifiedAt with current time`, async () => {
    let verificationToken: DocumentType<VerificationToken> | null =
      await createTestVerificationToken();
    expect(verificationToken.verifiedAt).toBeUndefined();
    await authService.useVerificationToken(verificationToken.token);
    verificationToken = await VerificationTokenModel.findOne({
      token: verificationToken.token
    });
    if (!verificationToken) {
      throw new Error(`Verification token does not exist.`);
    }
    expect(verificationToken.verifiedAt).not.toBeUndefined();
    expect(moment(verificationToken.verifiedAt).milliseconds()).toBe(
      moment().milliseconds()
    );
  });

  it(`should not verify other tokens if the token does not exist`, async () => {
    let verificationToken: DocumentType<VerificationToken> | null =
      await createTestVerificationToken();
    expect(verificationToken.verifiedAt).toBeUndefined();
    await authService.useVerificationToken(faker.datatype.uuid());
    verificationToken = await VerificationTokenModel.findOne({
      token: verificationToken.token
    });
    if (!verificationToken) {
      throw new Error(`Verification token does not exist.`);
    }
    expect(verificationToken.verifiedAt).toBeUndefined();
  });

  it(`should return false if the token does not exist`, async () => {
    const verificationToken: DocumentType<VerificationToken> =
      await createTestVerificationToken();
    const user = await verificationToken.getUser();
    if (!user) {
      throw new Error(`User does not exist.`);
    }
    const valid = await authService.checkIfVerificationTokenValid(
      `${verificationToken.token}-invalid-string`,
      verificationToken.type,
      user
    );
    expect(valid).toBeFalsy();
  });

  it(`should return false if the token is not associated to the user`, async () => {
    const verificationToken: DocumentType<VerificationToken> =
      await createTestVerificationToken();
    const user = await verificationToken.getUser();
    if (!user) {
      throw new Error(`User does not exist.`);
    }
    const anotherUser = await createTestUser();
    const valid = await authService.checkIfVerificationTokenValid(
      verificationToken.token,
      verificationToken.type,
      anotherUser
    );
    expect(valid).toBeFalsy();
  });

  it(`should return false if expiresAt is later than now`, async () => {
    const verificationToken: DocumentType<VerificationToken> =
      await createTestVerificationToken({
        expiresAt: moment().subtract(10, 'seconds').toDate()
      });
    const user = await verificationToken.getUser();
    if (!user) {
      throw new Error(`User does not exist.`);
    }
    const valid = await authService.checkIfVerificationTokenValid(
      verificationToken.token,
      verificationToken.type,
      user
    );
    expect(valid).toBeFalsy();
  });

  it(`should return true if expiresAt is earlier than now`, async () => {
    const verificationToken: DocumentType<VerificationToken> =
      await createTestVerificationToken({
        expiresAt: moment().add(10, 'seconds').toDate()
      });
    const user = await verificationToken.getUser();
    if (!user) {
      throw new Error(`User does not exist.`);
    }
    const valid = await authService.checkIfVerificationTokenValid(
      verificationToken.token,
      verificationToken.type,
      user
    );
    expect(valid).toBeTruthy();
  });

  it(`should set user's emailVerifiedAt field with current date time`, async () => {
    let user: DocumentType<User> | null = await createTestUser();
    const verificationToken: DocumentType<VerificationToken> | null =
      await createTestVerificationToken({
        userId: user.id
      });
    await authService.verifyEmail(user, verificationToken.token);
    user = await userService.findUserById(user.id);
    if (!user) {
      throw new Error(`User does not exist.`);
    }
    expect(user.emailVerifiedAt).not.toBeUndefined();
    expect(moment(user.emailVerifiedAt).milliseconds()).toBe(
      moment().milliseconds()
    );
  });

  it(`should also use the verification token`, async () => {
    const user: DocumentType<User> | null = await createTestUser();
    let verificationToken: DocumentType<VerificationToken> | null =
      await createTestVerificationToken({
        userId: user.id
      });
    await authService.verifyEmail(user, verificationToken.token);
    verificationToken = await VerificationTokenModel.findOne({
      token: verificationToken.token
    });
    if (!verificationToken) {
      throw new Error(`Verification token does not exist.`);
    }
    expect(verificationToken.verifiedAt).not.toBeUndefined();
    expect(moment(verificationToken.verifiedAt).milliseconds()).toBe(
      moment().milliseconds()
    );
  });

  const getRegisterUserParams = (): {
    name: string;
    email: string;
    password: string;
  } => {
    return {
      name: faker.name.fullName(),
      email: faker.internet.email(),
      password: faker.internet.password(10)
    };
  };
});

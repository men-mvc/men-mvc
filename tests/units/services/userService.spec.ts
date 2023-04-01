import { DocumentType } from '@typegoose/typegoose';
import { faker } from '@faker-js/faker';
import dateAndTime from 'date-and-time';
import { mockNow, restoreNowMock, withApplication } from '../../testUtilities';
import {
  createUser,
  CreateUserParams,
  findUserByEmail,
  findUserById
} from '../../../src/services/userService';
import { User, UserModel } from '../../../src/models/user';
import { createTestUsers } from '../../factories/userFactory';
import { FAKE_MONGODB_OBJECT_ID } from '../../globals';

describe(`UserService`, () => {
  withApplication();

  beforeAll(mockNow);
  afterAll(restoreNowMock);

  it(`should create user`, async () => {
    const data = generateUserData();
    await createUser(data);
    const user = await UserModel.findOne({
      email: data.email.toLowerCase()
    });
    expect(user).not.toBeNull();
    if (!user) {
      throw new Error(`User does not exist`);
    }
    assertUserHasData(user, data);
  });

  it(`should return created user`, async () => {
    const data = generateUserData();
    const user = await createUser(data);

    expect(user).not.toBeNull();
    assertUserHasData(user, data);
  });

  it(`should only return the user has the input email`, async () => {
    const users = await createTestUsers(3);
    const targetUser = users[1];
    const returnedUser = await findUserByEmail(targetUser.email);
    expect(returnedUser).not.toBeNull();
    if (!returnedUser) {
      throw new Error(`User does not exist.`);
    }
    expect(targetUser.id).toBe(returnedUser.id);
    expect(targetUser.email).toBe(returnedUser.email);
  });

  it(`should return null when there is no user with the input email`, async () => {
    await createTestUsers(2);
    const user = await findUserByEmail(faker.internet.email());
    expect(user).toBeNull();
  });

  it(`should only return the user that has the input id`, async () => {
    const users = await createTestUsers(3);
    const targetUser = users[1];
    const returnedUser = await findUserById(targetUser.id);
    expect(returnedUser).not.toBeNull();
    if (!returnedUser) {
      throw new Error(`User does not exist.`);
    }
    expect(targetUser.id).toBe(returnedUser.id);
    expect(targetUser.email).toBe(returnedUser.email);
  });

  it(`should return null when there is no user with the input id`, async () => {
    await createTestUsers(3);
    const user = await findUserById(FAKE_MONGODB_OBJECT_ID);
    expect(user).toBeNull();
  });

  const assertUserHasData = (
    user: DocumentType<User>,
    data: CreateUserParams
  ) => {
    expect(user.name).toBe(data.name);
    expect(user.email).toBe(data.email.toLowerCase());
    expect(user.password).toBe(data.password);
    expect(user.emailVerifiedAt?.getTime()).toBe(
      data.emailVerifiedAt?.getTime()
    );
    expect(user.isActive).toBe(data.isActive);
    expect(user.createdAt.getTime()).toBe(new Date().getTime());
  };

  const generateUserData = (): CreateUserParams => ({
    name: faker.name.fullName(),
    email: faker.internet.email(),
    password: faker.datatype.uuid(),
    emailVerifiedAt: dateAndTime.addSeconds(new Date(), -10),
    isActive: faker.datatype.boolean()
  });
});

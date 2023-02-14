import { DocumentType } from '@typegoose/typegoose';
import { DeepPartial } from '@men-mvc/core';
import { faker } from '@faker-js/faker';
import { User, UserModel } from '../../src/models/user';
import { hashPassword } from '../../src/services/authService';
import { USER_PASSWORD } from '../globals';

const getData = async (
  data: DeepPartial<User> = {}
): Promise<DeepPartial<User>> => {
  const defaultData: User = {
    name: faker.name.fullName(),
    email: faker.internet.email().toLowerCase(),
    password: await hashPassword(USER_PASSWORD),
    isActive: true,
    createdAt: new Date()
  };

  return {
    ...defaultData,
    ...data
  };
};

export const createTestUser = async (
  data: DeepPartial<User> = {}
): Promise<DocumentType<User>> => {
  const user = await UserModel.create(await getData(data));

  return user;
};

export const createTestUsers = async (
  count: number,
  data: DeepPartial<User> = {}
): Promise<DocumentType<User>[]> => {
  const manyData: DeepPartial<User>[] = [];
  for (let i = 0; i < count; i++) {
    const finalData = await getData(data);
    manyData.push(finalData);
  }

  return UserModel.insertMany(manyData);
};

import { hashPassword } from '@men-mvc/essentials';
import { DocumentType } from '@typegoose/typegoose';
import { faker } from '@faker-js/faker';
import { User, UserModel } from '../../src/models/user';
import { USER_PASSWORD } from '../globals';

const generateData = async (
  data: Partial<User> = {}
): Promise<Partial<User>> => {
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
  data: Partial<User> = {}
): Promise<DocumentType<User>> => UserModel.create(await generateData(data));

export const createTestUsers = async (
  count: number,
  data: Partial<User> = {}
): Promise<DocumentType<User>[]> => {
  const manyData: Partial<User>[] = [];
  for (let i = 0; i < count; i++) {
    const finalData = await generateData(data);
    manyData.push(finalData);
  }

  return UserModel.insertMany(manyData);
};

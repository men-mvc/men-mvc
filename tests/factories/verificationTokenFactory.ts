import { DocumentType } from '@typegoose/typegoose';
import { faker } from '@faker-js/faker';
import dateAndTime from 'date-and-time';
import {
  VerificationToken,
  VerificationTokenModel
} from '../../src/models/verificationToken';
import { createTestUser } from './userFactory';
import { getRandomVerificationTokenType } from './utilities';
import { VerificationTokenType } from '../../src/types';

export const createTestVerificationToken = async (
  data: {
    token?: string;
    type?: VerificationTokenType;
    createdAt?: Date;
    verifiedAt?: Date;
    expiresAt?: Date;
    userId?: string;
  } = {}
): Promise<DocumentType<VerificationToken>> => {
  let userId = data.userId;
  if (!data.userId) {
    const user = await createTestUser();
    userId = user.id;
  }
  delete data.userId;
  const defaultData = {
    token: faker.datatype.uuid(),
    type: getRandomVerificationTokenType(),
    createdAt: new Date(),
    expiresAt: dateAndTime.addDays(new Date(), 3),
    user: userId
  };

  return await VerificationTokenModel.create({
    ...defaultData,
    ...data
  });
};

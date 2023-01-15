import { DocumentType } from '@typegoose/typegoose';
import { User, UserModel } from '../models/user';

/**
 * the types below are in this service file because they are tightly tied to this service file.
 */
export type CreateUserParams = {
  name: string;
  email: string;
  password?: string;
  emailVerifiedAt: Date | null;
  isActive: boolean;
};

export type UpdateUserParams = Partial<CreateUserParams>;

const formatEmail = (email: string): string => email.toLowerCase().trim();

export const createUser = async (
  data: CreateUserParams
): Promise<DocumentType<User>> =>
  UserModel.create({
    ...data,
    email: formatEmail(data.email),
    createdAt: Date.now()
  });

export const findUserByEmail = async (
  email: string
): Promise<DocumentType<User> | null> =>
  UserModel.findOne({
    email: email.toLowerCase().trim()
  });

export const findUserById = async (
  id: string
): Promise<DocumentType<User> | null> => UserModel.findById(id);

export const updateUser = async (
  user: DocumentType<User>,
  data: UpdateUserParams
): Promise<DocumentType<User>> => {
  if (data.email) {
    data.email = formatEmail(data.email.toLowerCase().trim());
  }
  const returnedUser = await UserModel.findByIdAndUpdate(user.id, {
    $set: data
  });

  return returnedUser as DocumentType<User>;
};

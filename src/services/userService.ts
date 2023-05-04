import { DocumentType } from '@typegoose/typegoose';
import { Service } from 'typedi';
import { User, UserModel } from '../models/user';

/**
 * the types below are in this service file because they are tightly tied to this service file.
 */
export type CreateUserArgs = {
  name: string;
  email: string;
  password?: string;
  emailVerifiedAt: Date | null;
  isActive: boolean;
};

@Service()
export class UserService {
  private formatEmail(email: string): string {
    return email.toLowerCase().trim();
  }

  public createUser(data: CreateUserArgs): Promise<DocumentType<User>> {
    return UserModel.create({
      ...data,
      email: this.formatEmail(data.email),
      createdAt: Date.now()
    });
  }

  public findUserByEmail(email: string): Promise<DocumentType<User> | null> {
    return UserModel.findOne({
      email: this.formatEmail(email)
    });
  }

  public findUserById(id: string): Promise<DocumentType<User> | null> {
    return UserModel.findById(id);
  }
}

declare module Express {
  import { DocumentType } from '@typegoose/typegoose';
  import { User } from '../../src/models/user';

  export interface Request {
    authUser?: DocumentType<User>;
  }
}

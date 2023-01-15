import {
  prop,
  getModelForClass,
  Ref,
  DocumentType
} from '@typegoose/typegoose';
import { User, UserModel } from './user';
import { VerificationTokenType } from '../types';

export class VerificationToken {
  @prop({ required: true, type: String })
  public token!: string;

  @prop({ required: true, type: Number })
  public type!: VerificationTokenType;

  @prop({ required: true, type: Date, default: Date.now() })
  public createdAt!: Date;

  @prop({ required: false, type: Date })
  public verifiedAt?: Date;

  @prop({ required: true, type: Date })
  public expiresAt!: Date;

  @prop({ ref: () => User })
  public user!: Ref<User>;

  public async getUser(
    this: DocumentType<VerificationToken>
  ): Promise<DocumentType<User> | null> {
    if (!this.user) {
      return null;
    }

    return UserModel.findById(this.user.toString());
  }
}

export const VerificationTokenModel = getModelForClass(VerificationToken);

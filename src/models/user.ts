import {
  getModelForClass,
  modelOptions,
  prop,
  Severity
} from '@typegoose/typegoose';

@modelOptions({
  schemaOptions: {
    toJSON: {
      transform: (doc: unknown, ret) => {
        delete ret.password;
      }
    }
  },
  options: {
    allowMixed: Severity.ALLOW
  }
})
export class User {
  @prop({ required: true, type: String })
  public name!: string;

  @prop({ required: true, unique: true, type: String })
  public email!: string;

  @prop({ required: false, type: String })
  public password!: string;

  @prop({ required: true, type: Boolean, default: true })
  public isActive!: boolean;

  @prop({ required: false, type: Date })
  public emailVerifiedAt?: Date;

  @prop({ required: true, type: Date, default: Date.now() })
  public createdAt!: Date;
}

export const UserModel = getModelForClass(User);

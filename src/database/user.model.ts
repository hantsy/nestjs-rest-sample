import { compare, hash } from 'bcrypt';
import {
  Connection,
  HydratedDocument,
  Model,
  Schema,
  SchemaTypes,
  Types,
} from 'mongoose';
import { from, Observable } from 'rxjs';
import { RoleType } from '../shared/enum/role-type.enum';
import { stat } from 'node:fs';

interface User {
  _id: Types.ObjectId;
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly roles?: RoleType[];
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
}

interface UserMethods {
  comparePassword(password: string): Observable<boolean>;
}

interface UserModel extends Model<User, object, UserMethods> {
  staticMethodExample(): string;
}

const UserSchema = new Schema<User, UserModel, UserMethods>(
  {
    username: SchemaTypes.String,
    password: SchemaTypes.String,
    email: SchemaTypes.String,
    firstName: { type: SchemaTypes.String, required: false },
    lastName: { type: SchemaTypes.String, required: false },
    roles: [
      { type: SchemaTypes.String, enum: ['ADMIN', 'USER'], required: false },
    ],
    // use timestamps option to generate it automaticially.
    //   createdAt: { type: SchemaTypes.Date, required: false },
    //   updatedAt: { type: SchemaTypes.Date, required: false },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
    },
  },
);

// see: https://wanago.io/2020/05/25/api-nestjs-authenticating-users-bcrypt-passport-jwt-cookies/
// and https://stackoverflow.com/questions/48023018/nodejs-bcrypt-async-mongoose-login
async function preSaveHook(this: HydratedDocument<User, UserMethods>) {
  // Only run this function if password was modified
  if (!this.isModified('password')) return;

  // Hash the password
  const password = await hash(this.password, 12);
  this.set('password', password);
}

UserSchema.pre<HydratedDocument<User, UserMethods>>('save', preSaveHook);

function comparePasswordMethod(
  this: HydratedDocument<User, UserMethods>,
  password: string,
): Observable<boolean> {
  return from(compare(password, this.password));
}

UserSchema.methods.comparePassword = comparePasswordMethod;

function nameGetHook(this: HydratedDocument<User, UserMethods>): string {
  return `${this.firstName} ${this.lastName}`;
}

UserSchema.statics.staticMethodExample = function () {
  console.log('This is a static method');
  return 'hello';
};

UserSchema.virtual('name').get(nameGetHook);

UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'createdBy',
});

const createUserModel: (conn: Connection) => UserModel = (conn: Connection) =>
  conn.model<User, UserModel>('User', UserSchema, 'users');

export {
  User,
  UserModel,
  UserMethods,
  createUserModel,
  UserSchema,
  preSaveHook,
  nameGetHook,
  comparePasswordMethod,
};

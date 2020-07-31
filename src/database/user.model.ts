import { genSalt, compare, hash} from 'bcrypt';
import { NextFunction } from 'express';
import { Connection, Document, Model, Schema, SchemaTypes } from 'mongoose';
import { Observable, of, from } from "rxjs";
import { RoleType } from '../common/enum/role-type.enum';
interface User extends Document {
  comparePassword(password: string): Observable<boolean>;
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly roles?: RoleType[];
}

type UserModel = Model<User>;

const UserSchema = new Schema(
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
      virtuals: true
    }
  },
);

// see: https://wanago.io/2020/05/25/api-nestjs-authenticating-users-bcrypt-passport-jwt-cookies/
// and https://stackoverflow.com/questions/48023018/nodejs-bcrypt-async-mongoose-login
UserSchema.pre<User>('save', function (next: NextFunction) {
  const user = this as User;

  if (this.isModified('password') || this.isNew) {
    genSalt(10, (err: any, salt: any) => {
      if (err) {
        return next(err);
      }

      hash(user.password, salt, (err, hash) => {
        if (err) {
          return next(err);
        }
        user.set('password', hash);
        next();
      });
    });
  } else {
    next();
  }
});

UserSchema.methods.comparePassword = function (password:string): Observable<boolean> {
  return from(compare(password, this.password));
};

UserSchema.virtual('name').get(function () {
  return `${this.firstName} ${this.lastName}`;
});

UserSchema.virtual('posts', {
  ref: 'Post',
  localField: '_id',
  foreignField: 'createdBy',
});

const userModelFn: (conn: Connection) => UserModel = (conn: Connection) =>
  conn.model<User, UserModel>('User', UserSchema, 'users');

export { User, UserModel, UserSchema, userModelFn };

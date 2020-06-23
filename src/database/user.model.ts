import { Connection, Document, Schema, SchemaTypes } from 'mongoose';
import { RoleType } from './role-type.enum';
export interface User extends Document {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly roles?: RoleType[];
}

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
    //   createdAt: { type: SchemaTypes.Date, required: false },
    //   updatedAt: { type: SchemaTypes.Date, required: false },
  },
  { timestamps: true },
);

UserSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

export const userModelFn = (conn: Connection) =>
  conn.model<User>('User', UserSchema, 'users');

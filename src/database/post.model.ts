import { Document, Schema, SchemaTypes } from 'mongoose';
import { User } from './user.model';

interface Post extends Document {
  readonly title: string;
  readonly content: string;
  readonly createdBy?: Partial<User>;
  readonly updatedBy?: Partial<User>;
}

const PostSchema = new Schema(
  {
    title: SchemaTypes.String,
    content: SchemaTypes.String,
    createdBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
    updatedBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true },
);

export { Post, PostSchema }

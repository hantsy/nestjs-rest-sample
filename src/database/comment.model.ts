import { Document, Schema, SchemaTypes } from 'mongoose';
import { User } from './user.model';
import { Post } from './post.model';

export interface Comment extends Document {
  readonly content: string;
  readonly post?: Partial<Post>;
  readonly createdBy?: Partial<User>;
  readonly updatedBy?: Partial<User>;
}

export const CommentSchema = new Schema(
  {
    content: SchemaTypes.String,
    post: { type: SchemaTypes.ObjectId, ref: 'Post', required: false },
    createdBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
    updatedBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true },
);

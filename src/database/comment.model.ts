import { Document, Schema, SchemaTypes } from 'mongoose';
import { Post } from './post.model';
import { User } from './user.model';

interface Comment extends Document {
  readonly content: string;
  readonly post?: Partial<Post>;
  readonly createdBy?: Partial<User>;
  readonly updatedBy?: Partial<User>;
}

const CommentSchema = new Schema(
  {
    content: SchemaTypes.String,
    post: { type: SchemaTypes.ObjectId, ref: 'Post', required: false },
    createdBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
    updatedBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true },
);

export { Comment, CommentSchema };

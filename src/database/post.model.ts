import { Connection, Document, Model, Schema, SchemaTypes } from 'mongoose';
import { User } from './user.model';

interface Post extends Document {
  readonly title: string;
  readonly content: string;
  readonly createdBy?: Partial<User>;
  readonly updatedBy?: Partial<User>;
}

type PostModel = Model<Post>;

const PostSchema = new Schema<Post>(
  {
    title: SchemaTypes.String,
    content: SchemaTypes.String,
    createdBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
    updatedBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true },
);

const createPostModel: (conn: Connection) => PostModel = (conn: Connection) =>
  conn.model<Post>('Post', PostSchema, 'posts');

export { Post, PostModel, createPostModel };

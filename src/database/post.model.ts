import { Connection, Model, Schema, SchemaTypes, Types } from 'mongoose';

interface Post {
  _id: Types.ObjectId;
  readonly title: string;
  readonly content: string;
  readonly createdBy?: Types.ObjectId;
  readonly updatedBy?: Types.ObjectId;
  readonly createdAt?: Date;
  readonly updatedAt?: Date;
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

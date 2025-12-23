import {
  Connection,
  Document,
  Model,
  Schema,
  SchemaTypes,
  Types,
} from 'mongoose';

interface Comment extends Document {
  readonly content: string;
  readonly post?: Types.ObjectId;
  readonly createdBy?: Types.ObjectId;
  readonly updatedBy?: Types.ObjectId;
}

type CommentModel = Model<Comment>;

const CommentSchema = new Schema<Comment>(
  {
    content: SchemaTypes.String,
    post: { type: SchemaTypes.ObjectId, ref: 'Post', required: false },
    createdBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
    updatedBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true },
);

const createCommentModel: (conn: Connection) => CommentModel = (
  connection: Connection,
) => connection.model<Comment>('Comment', CommentSchema, 'comments');

export { Comment, CommentModel, createCommentModel };

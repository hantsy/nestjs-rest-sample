import { Connection } from 'mongoose';
import { CommentSchema } from './comment.model';
import {
  COMMENT_MODEL, DATABASE_CONNECTION,
  POST_MODEL,
  USER_MODEL
} from './database.constants';
import { Post, PostSchema } from './post.model';
import { userModelFn } from './user.model';

export const databaseModelsProviders = [
  {
    provide: POST_MODEL,
    useFactory: (connection: Connection) =>
      connection.model<Post>('Post', PostSchema, 'posts'),
    inject: [DATABASE_CONNECTION],
  },
  {
    provide: COMMENT_MODEL,
    useFactory: (connection: Connection) =>
      connection.model<Post>('Comment', CommentSchema, 'comments'),
    inject: [DATABASE_CONNECTION],
  },
  {
    provide: USER_MODEL,
    useFactory: (connection: Connection) => userModelFn(connection),
    inject: [DATABASE_CONNECTION],
  },
];

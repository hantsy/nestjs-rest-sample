import { connect, Connection } from 'mongoose';
import * as mongoose from 'mongoose';
import { PostSchema, Post } from './post.model';
import { userModelFn } from './user.model';
import {
  DATABASE_CONNECTION,
  POST_MODEL,
  USER_MODEL,
  COMMENT_MODEL,
} from './database.constants';
import { CommentSchema } from './comment.model';
import mongodbConfig from '../config/mongodb.config';
import { ConfigType } from '@nestjs/config';

export const databaseProviders = [
  {
    provide: DATABASE_CONNECTION,
    useFactory: (
      dbConfig: ConfigType<typeof mongodbConfig>,
    ): Promise<typeof mongoose> =>
      connect(dbConfig.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
    inject: [mongodbConfig.KEY],
  },
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

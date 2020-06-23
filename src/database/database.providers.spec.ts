import { Test, TestingModule } from '@nestjs/testing';
import { databaseProviders } from './database.providers';
import * as mongoose from 'mongoose';
import {
  DATABASE_CONNECTION,
  USER_MODEL,
  POST_MODEL,
} from './database.constants';
import { Post } from './post.model';
import { User } from './user.model';
import { Model } from 'mongoose';

describe('DatabaseProviders', () => {
  let conn: any;
  let userModel: any;
  let postModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...databaseProviders],
    })
      .overrideProvider(DATABASE_CONNECTION)
      .useValue({
        model: jest.fn().mockReturnValue({} as Model<User|Post>),
      })
      .compile();

    conn = module.get<typeof mongoose>(DATABASE_CONNECTION);
    userModel = module.get<Model<User>>(USER_MODEL);
    postModel = module.get<Model<Post>>(POST_MODEL);
  });

  it('DATABASE_CONNECTION should be defined', () => {
    expect(conn).toBeDefined();
  });

  it('USER_MODEL should be defined', () => {
    expect(userModel).toBeDefined();
  });

  it('POST_MODEL should be defined', () => {
    expect(postModel).toBeDefined();
  });
});

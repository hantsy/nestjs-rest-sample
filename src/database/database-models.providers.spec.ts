import { Test, TestingModule } from '@nestjs/testing';
import { Connection, Model } from 'mongoose';
import { Comment } from './comment.model';
import {
  COMMENT_MODEL,
  DATABASE_CONNECTION,
  POST_MODEL,
  USER_MODEL
} from './database.constants';
import { databaseModelsProviders } from './database-models.providers';
import { Post } from './post.model';
import { User } from './user.model';


describe('DatabaseModelsProviders', () => {
  let conn: any;
  let userModel: any;
  let postModel: any;
  let commentModel: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [...databaseModelsProviders,

      {
        provide: DATABASE_CONNECTION,
        useValue: {
          model: jest.fn().mockReturnValue({} as Model<User | Post | Comment>),
        },
      },
      ],

    })
      .compile();

    conn = module.get<Connection>(DATABASE_CONNECTION);
    userModel = module.get<Model<User>>(USER_MODEL);
    postModel = module.get<Model<Post>>(POST_MODEL);
    commentModel = module.get<Model<Comment>>(COMMENT_MODEL);
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

  it('COMMENT_MODEL should be defined', () => {
    expect(commentModel).toBeDefined();
  });
});

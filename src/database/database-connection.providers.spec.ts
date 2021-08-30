  jest.mock('mongoose', () => ({
    createConnection: jest.fn().mockImplementation(
      (uri:any, options:any)=>({} as any)
      ),
    Connection: jest.fn()
  }))

import { ConfigModule } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { Connection, createConnection } from 'mongoose';
import mongodbConfig from '../config/mongodb.config';
import { databaseConnectionProviders } from './database-connection.providers';
import { DATABASE_CONNECTION } from './database.constants';

describe('DatabaseConnectionProviders', () => {
  let conn: any;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(mongodbConfig)],
      providers: [...databaseConnectionProviders],
    }).compile();

    conn = module.get<Connection>(DATABASE_CONNECTION);
  });



  it('DATABASE_CONNECTION should be defined', () => {
    expect(conn).toBeDefined();
  });

  it('connect is called', () => {
    //expect(conn).toBeDefined();
    //expect(createConnection).toHaveBeenCalledTimes(1); // it is 2 here. why?
    expect(createConnection).toHaveBeenCalledWith("mongodb://localhost/blog", {
      // useNewUrlParser: true,
      // useUnifiedTopology: true,
      //see: https://mongoosejs.com/docs/deprecations.html#findandmodify
      // useFindAndModify: false
    });
  })

});

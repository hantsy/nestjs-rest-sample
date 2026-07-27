jest.mock('mongoose', () => ({
  createConnection: jest.fn().mockImplementation((uri: any) => ({}) as any),
  Connection: jest.fn(),
}));

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
    expect(createConnection).toHaveBeenCalledWith('mongodb://localhost/blog');
  });
});

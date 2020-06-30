import { Module } from '@nestjs/common';
import { databaseProviders } from './database.providers';
import { ConfigModule } from '@nestjs/config';
import mongodbConfig from '../config/mongodb.config';

@Module({
  imports: [ConfigModule.forFeature(mongodbConfig)],
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}

import { ConfigType } from '@nestjs/config';
import { Connection, createConnection } from 'mongoose';
import mongodbConfig from '../config/mongodb.config';
import { DATABASE_CONNECTION } from './database.constants';

export const databaseConnectionProviders = [
  {
    provide: DATABASE_CONNECTION,
    useFactory: (dbConfig: ConfigType<typeof mongodbConfig>): Connection => {
      const conn = createConnection(dbConfig.uri, {
        //useNewUrlParser: true,
        //useUnifiedTopology: true,
        //see: https://mongoosejs.com/docs/deprecations.html#findandmodify
        //useFindAndModify: false,
      });

      // conn.on('disconnect', () => {
      //   console.log('Disconnecting to MongoDB');
      // });

      return conn;
    },
    inject: [mongodbConfig.KEY],
  },
];

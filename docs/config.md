# Externalizing the configuration

Till now, all configurations in our application is working for the local development environment, but they are written in hard codes. 

In the development and deployment stages of a real world application,  we have to consider a  flexible way to alter the configurations in the production environment without any code changes while the application is deployed continuously through a predefined delivery pipeline. 

Nestjs provides excellent configuration support, thus your application can read the configuration values from environment variables,  a *.env* file, etc. More info about the configuration, check  the [Configuration ](https://docs.nestjs.com/techniques/configuration) chapter from the Nestjs official docs.

In this post, we will move our hard-coded configuration we've used in the previous posts to a central place and organize them with the NestJS configuration facilities.

## Introduce to ConfigModule

First of all, install `@nestjs/config` package.

```bash
npm install @nestjs/config
```

Simply, import  `ConfigModule` in the top-level `AppModule`.

```typescript

import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [ConfigModule.forRoot()],
})
export class AppModule {}
```

It will register a `ConfigService`  for you to read configuration properties by calling its `get` method.

```typescript
configService.get<string>('MONGO_URI')
```

Internally, Nestjs will scan `.env` file in the root folder. 

The following is a sample of the content of the `.env` file.

```env
MONGO_URI=mongodb://localhost/blog
```

If you want to read configuration from an environment-aware file, eg. `.dev.env` for development phase, then configure the location in `ConfigModule`.

```typescript
ConfigModule.forRoot({
  envFilePath: '.dev.env',
});
```

For the container deployment or cloud deployment, setup configuration in a config server or as environment variables or  K8s *ConfigMap* is more popular. 

## Externalizing application configurations

Personally, I prefer use a default hard-coded configuration in the development phase, and use environmental variables to override it in the production.

Nestjs also support load custom configuration where it can read configurations from the environment variables freely.

In the `AppModule`, disable  `.env` file support for `ConfigModule`.

```typescript
@Module({
   imports:[
    	ConfigModule.forRoot({ ignoreEnvFile: true }),
	] 
})
export class AppModule{}
```

Then create a *config* folder to organize all configurations in this application.

In the config folder, add a new configuration for *Mongo* database.

```typescript
//config/mongodb.config.ts

import { registerAs } from '@nestjs/config';

export default registerAs('mongodb', () => ({
  uri: process.env.MONGODB_URI || 'mongodb://localhost/blog',
}));
```

Here we use `registerAs`  to group the configurations related to the context *mongodb*.

In the `DatabaseModule`, load the *mongodb* configuration.

```typescript
import { databaseConnectionProviders } from './database-connection.providers';

@Module({
  imports: [ConfigModule.forFeature(mongodbConfig)],
  providers: [...databaseConnectionProviders,],
  exports: [...databaseConnectionProviders, ],
})
export class DatabaseModule { }
```

> You can also use Nestjs ConfigModule to load the configuration globally, but here we do not want to expose the mongodb config to other modules.

And change the database connection providers like this.

```typescript
import { ConfigType } from '@nestjs/config';
import { Connection, createConnection } from 'mongoose';
import mongodbConfig from '../config/mongodb.config';
import { DATABASE_CONNECTION } from './database.constants';

export const databaseConnectionProviders = [
  {
    provide: DATABASE_CONNECTION,
    useFactory: (dbConfig: ConfigType<typeof mongodbConfig>): Connection =>
      createConnection(dbConfig.uri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        //see: https://mongoosejs.com/docs/deprecations.html#findandmodify
        useFindAndModify: false
      }),
    inject: [mongodbConfig.KEY],
  }
];
```

In the above codes, provide a  token  `mongodbConfig.KEY`, you can inject a config instance as type `ConfigType<typeof mongodbConfig>`  in the factory method, then you can read the configuration in a **type safe** way via `dbConfig.uri`.

Similarly, create a configuration for the JWT authentication, move the existing JWT options into this configuration file.

```typescript
//config/jwt.config.ts
import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secretKey: process.env.JWT_SECRET_KEY || 'rzxlszyykpbgqcflzxsqcysyhljt',
  expiresIn: process.env.JWT_EXPIRES_IN || '3600s',
}));

```

In the `AuthModule`, apply the configuration like this.

```typescript
import { ConfigModule, ConfigType } from '@nestjs/config';
import jwtConfig from '../config/jwt.config';

@Module({
  imports: [
    ConfigModule.forFeature(jwtConfig),
    ...
    JwtModule.registerAsync({
      imports: [ConfigModule.forFeature(jwtConfig)],
      useFactory: (config: ConfigType<typeof jwtConfig>) => {
        return {
          secret: config.secretKey,
          signOptions: { expiresIn: config.expiresIn },
        } as JwtModuleOptions;
      },
      inject: [jwtConfig.KEY],
    }),
  ],
....
})
export class AuthModule {}
```

And open *jwt.stretagy.ts* file, change the value of **secretOrKey** to read from `jwtConfig`.

```typescript
import jwtConfig from '../../config/jwt.config';
import { ConfigType } from '@nestjs/config';
//...

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(@Inject(jwtConfig.KEY) config: ConfigType<typeof jwtConfig>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.secretKey,
    });
  }
  //...
}
```

In a production environment, it is easy to change these settings by simply declaring an environment variables like this.

```base
export MONGODB_URI=mongodb://localhost:27019/blog
```

Or set it in the docker-compose file like this.

```typescript
version: '3.8' # specify docker-compose version
services:
  //...  
  api:
    environment:
      - "MONGODB_URI=mongodb://mongodb:27017/blog"
	//...
```

We will start a new topic of deployment in the further posts.



## Testing configurations

An example of `jwt-config.spec.ts`.

```typescript
import { ConfigModule, ConfigType } from '@nestjs/config';
import { TestingModule, Test } from '@nestjs/testing';
import jwtConfig from './jwt.config';

describe('jwtConfig', () => {
  let config: ConfigType<typeof jwtConfig>;
  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule.forFeature(jwtConfig)],
    }).compile();

    config = module.get<ConfigType<typeof jwtConfig>>(jwtConfig.KEY);
  });

  it('should be defined', () => {
    expect(jwtConfig).toBeDefined();
  });

  it('should contains expiresIn and secret key', async () => {
    expect(config.expiresIn).toBe('3600s');
    expect(config.secretKey).toBe('rzxlszyykpbgqcflzxsqcysyhljt');
  });
});
```

Grab [the source codes from my github](https://github.com/hantsy/nestjs-sample), switch to branch [feat/config](https://github.com/hantsy/nestjs-sample/blob/feat/config).




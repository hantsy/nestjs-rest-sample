# Protect your API resource with JWT Token

In the last post, we connected to a Mongo server and use a real database to replace the dummy data storage. In this post, we will explore how to protect your APIs when exposing to a client application.

 When we come to the security of a web application,  technically it will include:

* **Authentication** - The application will ask you to provide your principal and then it will identify who are you.
* **Authorization**-  Based on your claims, check if you have permissions to perform some tasks.

[Passportjs](http://www.passportjs.org/)  is one of the most popular authentication framework for [expressjs](https://expressjs.com/) platform. Nestjs has great integration with passportjs with `@nestjs/passportjs`.  We will follow the [Authentication](https://docs.nestjs.com/techniques/authentication) chapter of the official guide to add *local* and *jwt* strategies  to your application.

## Prerequisites

Install passportjs related dependencies.

```bash
$ npm install --save @nestjs/passport passport passport-local @nestjs/jwt passport-jwt
$ npm install --save-dev @types/passport-local @types/passport-jwt 
```

Before starting the authentication work, let's generate some skeleton codes.

Firstly generate a `AuthModule` and `AuthService` .

```bash
nest g mo auth
nest g s auth
```
The authentication should work with users in the application. Create a standalone `UserModule` to handle user queries.

```bash
nest g mo user
nest g s user
```
Ok, let's begin to enrich the `AuthModule`.

## Implementing Authentication

First of all, let's create some resources for the user model, a  `Document` and `Schema`  file.

Create  new file under */user* folder.

```typescript
import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class User extends Document {
  @Prop({ require: true })
  readonly username: string;

  @Prop({ require: true })
  readonly email: string;

  @Prop({ require: true })
  readonly password: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
```
The `User` class is to wrap a document in Mongo,  and `UserSchema` is to describe `User` document.  

Register `UserSchema` in `UserModule`, then you can  use `Model<User>` to perform some operations on `User` document.

```typescript
@Module({
  imports: [MongooseModule.forFeature([{ name: 'users', schema: UserSchema }])],
  providers: [//...
  ],
  exports: [//...
  ],
})
export class UserModule {}
```

The *users* here is the token to identify different `Model` when injecting a `Model`.

Add a `findByUsername` method in `UserService`.

```typescript
@Injectable()
export class UserService {
  constructor(@InjectModel('users') private userModel: Model<User>) {}

  findByUsername(username: string): Observable<User | undefined> {
    return from(this.userModel.findOne({ username }).exec());
  }
}
```

Create a test case to test the `findByUsername` method.

```typescript
describe('UserService', () => {
  let service: UserService;
  let model: Model<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getModelToken('users'),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get<Model<User>>(getModelToken('users'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findByUsername should return user', async () => {
    jest
      .spyOn(model, 'findOne')
      .mockImplementation((conditions: any, projection: any, options: any) => {
        return {
          exec: jest.fn().mockResolvedValue({
            username: 'hantsy',
            email: 'hantsy@example.com',
          } as User),
        } as any;
      });

    const foundUser = await service.findByUsername('hantsy').toPromise();
    expect(foundUser).toEqual({
      username: 'hantsy',
      email: 'hantsy@example.com',
    });
    expect(model.findOne).lastCalledWith({username: 'hantsy'});
    expect(model.findOne).toBeCalledTimes(1);
  });
});
```
In  the  `@Module` declaration of the `UserModule`, register `UserService` in `providers`,  and do not forget to add it into  `exports`, thus other can use this service when importing `UserModule`.

Let's move to `AuthModule`. 

With `@nestjs/passpart`, it is simple to set up your passport strategy by extending `PassportStrategy`, we will create two passport strategies here. 

* `LocalStrategy`  to handle authentication by username and password fields from request.
* `JwtStrategy` to handle authentication by given JWT token header.

Simplify , generate two files by nest command line.

```bash
nest g class auth/local.strategy.ts --flat
nest g class auth/jwt.strategy.ts --flat
```

Firstly, let's implement the `LocalStrategy`.

```typescript
@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  validate(username: string, password: string): Observable<any> {
    return this.authService
      .validateUser(username, password)
      .pipe(throwIfEmpty(() => new UnauthorizedException()));
  }
}
```

In the constructor, use `super` to providing the essential options of the strategy you are using,  for a local strategy, it requires username and password fields.  

And the validate method it used to validate the authentication strategy against given  info, here it is the *username* and *password* provided from request.  

> More details about the configuration options and validation of local strategy, check [passport-local](http://www.passportjs.org/packages/passport-local/) project.

In `AuthService`, add a method `validateUser`.

```typescript
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  validateUser(username: string, pass: string): Observable<any> {
    return this.userService.findByUsername(username).pipe(
      map(user => {
        if (user && user.password === pass) {
          const { password, ...result } = user;
          return result;
        }
        return null;
      }),
    );
  }
}
```

> In the real application, we could use a crypto util to hash password.

It invokes `findByUsername` in `UserService` from `UserModule`.  Imports `UserModule` in the declaration of `AuthModule`.

```typescript
@Module({
  imports: [
    UserModule,
 	...]
    ...   
})
export class AuthModule {}
```

Let's create a method in `AppController` to implement the authentication by given username and password fields.

```typescript
@Controller()
export class AppController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('auth/login')
  login(@Req() req: Request): Observable<any> {
    return this.authService.login(req.user);
  }
}
```

It simply calls another method `login` in `AuthService`. 

```
@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}
  //...
  login(user: Partial<User>): Observable<any> {
    const payload = {
      sub: user.username,
      email: user.email,
      roles: user.roles,
    };
    return from(this.jwtService.signAsync(payload)).pipe(
      map(access_token => {
        access_token;
      }),
    );
  }
}
```

The `login` method is responsible for generating a JWT based access token based on the authenticated principal.  

The URI path `auth/login` use a `LocalAuthGuard` to protect it. 

```typescript
@Injectable()
export class LocalAuthGuard extends AuthGuard('local') {}
```

Let's summarize how local strategy works.

1. When a user hits *auth/login* with `username` and `password`, `LocalAuthGuard` will be applied.
2. `LocalAuthGuard` will trigger `LocalStrategy` , and invokes its `validate` method, and store the result back to `request.user`.
3. Back the controller,  read user principal from `request`, generate a JWT access token and send back to client.

After logging in, the `access token` can be extracted and put into the HTTP header in the new request to access the protected resources.

Let's have a look at how  jwt strategy works.

Firstly implement the `JwtStrategy`.

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  validate(payload: any) :any{
    return { email: payload.email, sub: payload.username };
  }
}
```

In the constructor, there are several options configured.

The `jwtFromRequest` specifies the approach to extract token,  it can be from HTTP cookie or request header `Authorization` . 

If `ignoreExpiration` is false, when decoding the JWT token, it will check expiration date.

The `secretOrKey` is used to sign the JWT token or decode token.

In the `validate` method, the payload is the content of  **decoded** JWT claims. You can add custom validation based on the claims.

> More about the configuration options and verify method, check [passport-jwt](http://www.passportjs.org/packages/passport-jwt/) project.

In the declaration of `AuthModule` , imports `JwtModule`, it accept a register method to add initial options for signing the JWT token.

```typescript
@Module({
  imports: [
     // ...
    JwtModule.register({
      secret: jwtConstants.secret,
      signOptions: { expiresIn: '60s' },
    }),
  ],
  providers: [//..., 
      LocalStrategy, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```

Similarly create a `JwtAuthGuard`, and register it in the *providers* in `AuthModule`.

```typescript
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt'){}
```

Create a method to read profile of the current user.

```typescript
@Controller()
export class AppController {
  constructor(private authService: AuthService) {}
  
  //...  
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request): any {
    return req.user;
  }
}
```

Let's  review the workflow of the JWT strategy.

1. Given a JWT token `XXX`, access */profile* with header `Authorization:Bearer XXX`.
2. `JwtAuthGuard` will trigger `JwtStrategy`, and calls `validate` method, and store the result back to `request.user`.
3. In the `getProfile` method,  send the `request.user` to client.

If you want to set a default strategy, change `PassportModule` in the declaration of `AuthModule`  to the following.

```typescript
@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    //...
})
export class AuthModule {}
```

Like the data initializer for Post, add a service to insert sample data for users.

```typescript
@Injectable()
export class UserDataInitializerService
  implements OnModuleInit, OnModuleDestroy {
  constructor(@InjectModel('users') private userModel: Model<User>) {}
  onModuleInit(): void {
    console.log('(UserModule) is initialized...');
    this.userModel
      .create({
        username: 'hantsy',
        password: 'password',
        email: 'hantsy@example.com',
      })
      .then(data => console.log(data));
  }
  onModuleDestroy(): void {
    console.log('(UserModule) is being destroyed...');
    this.userModel
      .deleteMany({})
      .then(del => console.log(`deleted ${del.deletedCount} rows`));
  }
}
```

Now run the application.

```bash
npm run start
```


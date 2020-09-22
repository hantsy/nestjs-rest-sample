# Handling user registration

In the previous posts, the user sample data is initialized in a service which is observing an `OnMoudleInit` event. 

In this post we will add an endpoint to handle user registration request, including:

* Add an endpoint */register* to handling user registration progress
* Hashing password with bcrypt
* Sending notifications via SendGrid mail service

## Registering a new user

Generate a register controller.

```bash
nest g controller user/register --flat
```
Fill the following content into the `RegisterController`.

```typescript
// user/register.controller.ts

@Controller('register')
export class RegisterController {
    constructor(private userService: UserService) { }

    @Post()
    register(
        @Body() registerDto: RegisterDto,
        @Res() res: Response): Observable<Response> {
        const username = registerDto.username;

        return this.userService.existsByUsername(username).pipe(
            flatMap(exists => {
                if (exists) {
                    throw new ConflictException(`username:${username} is existed`)
                }
                else {
                    const email = registerDto.email;
                    return this.userService.existsByEmail(email).pipe(
                        flatMap(exists => {
                            if (exists) {
                                throw new ConflictException(`email:${email} is existed`)
                            }
                            else {
                                return this.userService.register(registerDto).pipe(
                                    map(user =>
                                        res.location('/users/' + user.id)
                                            .status(201)
                                            .send()
                                    )
                                );
                            }
                        })
                    );
                }
            })
        );
    }
}
```

In the above codes, we will check  user existence by username and email respectively, then save the user data  into the MongoDB  database.

In the `UserService`, add the missing methods.

```typescript
@Injectable()
export class UserService {
    
  existsByUsername(username: string): Observable<boolean> {
    return from(this.userModel.exists({ username }));
  }

  existsByEmail(email: string): Observable<boolean> {
    return from(this.userModel.exists({ email }));
  }

  register(data: RegisterDto): Observable<User> {

    const created = this.userModel.create({
      ...data,
      roles: [RoleType.USER]
    });

    return from(created);
  }
  //...
}
```

Create a DTO class to represent the user registration request data. Generate the DTO skeleton firstly.

```bash
nest g class user/register.dto --flat
```
And fill the following content.

```typescript
import { IsEmail, IsNotEmpty, MaxLength, MinLength } from "class-validator";

export class RegisterDto {
    @IsNotEmpty()
    readonly username: string;

    @IsNotEmpty()
    @IsEmail()
    readonly email: string;

    @IsNotEmpty()
    @MinLength(8, { message: " The min length of password is 8 " })
    @MaxLength(20, { message: " The password can't accept more than 20 characters " })
    // @Matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])[0-9a-zA-Z]{8,20}$/,
    //     { message: " A password at least contains one numeric digit, one supercase char and one lowercase char" }
    // )
    readonly password: string;

    @IsNotEmpty()
    readonly firstName?: string;

    @IsNotEmpty()
    readonly lastName?: string;
}
```
In the above codes, the `@IsNotEmpty()`,`@IsEmail`, `@MinLength()`, `@MaxLength()`, `@Matches()` are from `class-validator`. If you have some experience of Java EE/Jakarta EE Bean Validation or Hibernate Validators, these annotations are easy to understand.

* `@IsNotEmpty()` to check  if the given value is empty
* `@IsEmail` to validate if the input string is an valid email format
* `@MinLength()` and `@MaxLength()`are to limit the length range of the input value
*  `@Matches()` is flexible for custom RegExp matches.

> More info about the usage of class-validator, check the details of project [typestack/class-validator](https://github.com/typestack/class-validator).

In the previous posts, we have applied a global `ValidationPipe` in `bootstrap` function in the `main.ts` entry file. When registering with invalid data,it will return a 404 error.

```bash
 $ curl http://localhost:3000/register -d "{}" {"statusCode":400,"message":["username should not be empty","email must be an em ail","email should not be empty"," The password can't accept more than 20 charac ters "," The min length of password is 8 ","password should not be empty","first Name should not be empty","lastName should not be empty"],"error":"Bad Request"}
```

Add a test for the `RegisterController`.

```typescript
describe('Register Controller', () => {
  let controller: RegisterController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegisterController],
      providers: [
        {
          provide: UserService,
          useValue: {
            register: jest.fn(),
            existsByUsername: jest.fn(),
            existsByEmail: jest.fn()
          },
        },
      ]
    }).compile();

    controller = module.get<RegisterController>(RegisterController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException when username is existed ', async () => {
      const existsByUsernameSpy = jest.spyOn(service, 'existsByUsername').mockReturnValue(of(true));
      const existsByEmailSpy = jest.spyOn(service, 'existsByEmail').mockReturnValue(of(true));
      const saveSpy = jest.spyOn(service, 'register').mockReturnValue(of({} as User));

      const responseMock = {
        location: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
      } as any;
      try {
        await controller.register({ username: 'hantsy' } as RegisterDto, responseMock).toPromise();
      } catch (e) {
        expect(e).toBeDefined();
        expect(existsByUsernameSpy).toBeCalledWith('hantsy');
        expect(existsByEmailSpy).toBeCalledTimes(0);
        expect(saveSpy).toBeCalledTimes(0)
      }
    });

    it('should throw ConflictException when email is existed ', async () => {
      const existsByUsernameSpy = jest.spyOn(service, 'existsByUsername').mockReturnValue(of(false));
      const existsByEmailSpy = jest.spyOn(service, 'existsByEmail').mockReturnValue(of(true));
      const saveSpy = jest.spyOn(service, 'register').mockReturnValue(of({} as User));

      const responseMock = {
        location: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
      } as any;
      try {
        await controller.register({ username: 'hantsy', email: 'hantsy@example.com' } as RegisterDto, responseMock).toPromise();
      } catch (e) {
        expect(e).toBeDefined();
        expect(existsByUsernameSpy).toBeCalledWith('hantsy');
        expect(existsByEmailSpy).toBeCalledWith('hantsy@example.com');
        expect(saveSpy).toBeCalledTimes(0)
      }
    });

    it('should save when username and email are available ', async () => {
      const existsByUsernameSpy = jest.spyOn(service, 'existsByUsername').mockReturnValue(of(false));
      const existsByEmailSpy = jest.spyOn(service, 'existsByEmail').mockReturnValue(of(false));
      const saveSpy = jest.spyOn(service, 'register').mockReturnValue(of({ _id: '123' } as User));

      const responseMock = {
        location: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis()
      } as any;

      const locationSpy = jest.spyOn(responseMock, 'location');
      const statusSpy = jest.spyOn(responseMock, 'status');
      const sendSpy = jest.spyOn(responseMock, 'send');

      await controller.register({ username: 'hantsy', email: 'hantsy@example.com' } as RegisterDto, responseMock).toPromise();

      expect(existsByUsernameSpy).toBeCalledWith('hantsy');
      expect(existsByEmailSpy).toBeCalledWith('hantsy@example.com');
      expect(saveSpy).toBeCalledTimes(1);
      expect(locationSpy).toBeCalled();
      expect(statusSpy).toBeCalled();
      expect(sendSpy).toBeCalled();

    });
  });
});
```

In the above testing codes, we go through all conditions and make sure all code blocks in the `RegisterController` are hit.

Correspondingly add tests for the newly added methods in `UserService` .  Here I skip the testing codes here, please check the [source code](https://github.com/hantsy/nestjs-sample/tree/feat/user) yourself.

## Hashing password 

In the former posts, we used plain text to store the password field in user document. In a real world application, we should choose a hash algorithm to encode the plain password for security consideration.

Bcrypt is very popular for hashing password. 

Install `bcypt` firstly.

```bash
npm install --save bcrypt
```

When saving a new user, hashing the password then save it. Add a pre save hook in the `User` model.

```typescript
async function preSaveHook(next) {

  // Only run this function if password was modified
  if (!this.isModified('password')) return next();

  // Hash the password
  const password = await hash(this.password, 12);
  this.set('password', password);

  next();
}

UserSchema.pre<User>('save', preSaveHook);
```

The `preSave` hook will be invoked before the new user data is being persisted into the MongoDB.

When a user is trying to login via username and password pair, it should check if password is matched to the one in the database.

Add a method to the `User` model.

```typescript
function comparePasswordMethod(password: string): Observable<boolean> {
  return from(compare(password, this.password));
}

UserSchema.methods.comparePassword = comparePasswordMethod;
```

Change the `validateUser` method of the `AuthService`, check the password if matched there.

```typescript
flatMap((user) => {
    const { _id, password, username, email, roles } = user;
    return user.comparePassword(pass).pipe(map(m => {
        if (m) {
            return { id: _id, username, email, roles } as UserPrincipal;
        }else {
            throw new UnauthorizedException('username or password is not matched')
        }
    }))
```

It is a little difficult to test the hooks of  the `User` model, to simplify the testing work,  here I  extract the  hooks to standalone functions, and mock the calling context in the tests.

```typescript
// see: https://stackoverflow.com/questions/58701700/how-do-i-test-if-statement-inside-my-mongoose-pre-save-hook
describe('preSaveHook', () => {
    test('should execute next middleware when password is not modified', async () => {
        const nextMock = jest.fn();
        const contextMock = {
            isModified: jest.fn()
        };
        contextMock.isModified.mockReturnValueOnce(false);
        await preSaveHook.call(contextMock, nextMock);
        expect(contextMock.isModified).toBeCalledWith('password');
        expect(nextMock).toBeCalledTimes(1);
    });

    test('should set password when password is modified', async () => {
        const nextMock = jest.fn();
        const contextMock = {
            isModified: jest.fn(),
            set: jest.fn(),
            password: '123456'
        };
        contextMock.isModified.mockReturnValueOnce(true);
        await preSaveHook.call(contextMock, nextMock);
        expect(contextMock.isModified).toBeCalledWith('password');
        expect(nextMock).toBeCalledTimes(1);
        expect(contextMock.set).toBeCalledTimes(1);
    });
});
```

Explore other tests for `comparePasswordMethod` etc in the [user.mdoel.sepc.ts](https://github.com/hantsy/nestjs-sample/blob/master/src/database/user.mdoel.spec.ts).

Now run the application, have a look at the log in the console about the user initialization, as you see the password stored in the MongoDB is hashed.

```typescript
(UserModule) is initialized...
[
  {
    roles: [ 'USER' ],
    _id: 5f477055fb9a2b3fa4cb1c21,
    username: 'hantsy',
    password: '$2b$12$/spjKM3Vdf5vRJE9u2cHaulIAWzKMbNVSyHjMp9E9PifbSEHTQrJy',
    email: 'hantsy@example.com',
    createdAt: 2020-08-27T08:35:33.800Z,
    updatedAt: 2020-08-27T08:35:33.800Z,
    __v: 0
  },
  {
    roles: [ 'ADMIN' ],
    _id: 5f477055fb9a2b3fa4cb1c22,
    username: 'admin',
    password: '$2b$12$kFhASRJPkb/WD99J4uZrf.ZkkeKghpvf/6pgVGQArGiIgXu5aNMe.',
    email: 'admin@example.com',
    createdAt: 2020-08-27T08:35:33.801Z,
    updatedAt: 2020-08-27T08:35:33.801Z,
    __v: 0
  }
]
```

## Registration Welcome Notification

Generally, in a real world application, a welcome email should be sent to the new registered user when the registration is completed successfully.

There are several modules can be used to send emails in NodeJS applications, for example, `nodemailer` etc.  There are also some cloud service for emails, such as [SendGrid](https://sendgrid.com/). There is an existing Nestjs module to integrate SendGrid to Nestjs, check [ntegral/nestjs-sendgrid](https://github.com/ntegral/nestjs-sendgrid) project.

In this sample, we will not use the existing one, and create a new home-use module for this application.

Install sendgrid npm package firstly.

```bash
npm i @sendgrid/mail
```

Generate a sendgrid module and a sendgrid service. 

```bash
nest g mo sendgrid
nest g s sendgrid
```

Add the following content into the `SendgridService`.

```typescript
@Injectable()
export class SendgridService {

    constructor(@Inject(SENDGRID_MAIL) private mailService: MailService) { }

    send(data: MailDataRequired): Observable<any>{
        //console.log(this.mailService)
        return from(this.mailService.send(data, false))
    }

}
```

Create a provider to expose the `MailService` from `@sendgrid/mail` package.

```typescript
export const sendgridProviders = [
    {
      provide: SENDGRID_MAIL,
      useFactory: (config: ConfigType<typeof sendgridConfig>): MailService =>
        {
            const mail = new MailService();
            mail.setApiKey(config.apiKey);
            mail.setTimeout(5000);
            //mail.setTwilioEmailAuth(username, password)
            return mail;
        },
      inject: [sendgridConfig.KEY],
    }
  ];

```

Accordingly, add a config for sendgrid.

```typescript
//config/sendgrid.config.ts
export default registerAs('sendgrid', () => ({
  apiKey: process.env.SENDGRID_API_KEY || 'SG.test',
}));
```

> Signup SendGrid and generate an API Key for your applications to send emails.

Declares  sendgrid related config, provider and service in `SendgridModule`.

```typescript
@Module({
  imports: [ConfigModule.forFeature(sendgridConfig)],
  providers: [...sendgridProviders, SendgridService],
  exports: [...sendgridProviders, SendgridService]
})
export class SendgridModule { }
```

Change the register function in the `UserService`.

```typescript

    const msg = {
      from: 'hantsy@gmail.com', // Use the email address or domain you verified above
      subject: 'Welcome to Nestjs Sample',
      templateId: "d-cc6080999ac04a558d632acf2d5d0b7a",
      personalizations: [
        {
          to: data.email,
          dynamicTemplateData: { name: data.firstName + ' ' + data.lastName },
        }
      ]

    };
    return this.sendgridService.send(msg).pipe(
      catchError(err=>of(`sending email failed:${err}`)),
      tap(data => console.log(data)),
      flatMap(data => from(created)),
    );
```
>The templateId is the id of the templates managed by SendGrid. SendGrid has great web UI for you to compose and manage email templates.

Ideally, a user registration progress should be split into two steps.  

* Validate the user input data from the registration form, and persist it into the MongoDB, then send a verification number to verify the registered phone number, email, etc.  In this stage, the user account will be suspended to verify.
* The registered user receive the verification number or links in emails, provide it in the verification page or click the link in the email directly, and get verified. In this stage, the user account will be activated.

Grab [the source codes from my github](https://github.com/hantsy/nestjs-sample), switch to branch [feat/user](https://github.com/hantsy/nestjs-sample/blob/feat/user).


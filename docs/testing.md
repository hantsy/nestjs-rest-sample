# Testing Nestjs applications

In the previous posts,  I have write a lot of testing codes to verify if  our application is working as expected.

Nestjs provides integration with with [Jest](https://github.com/facebook/jest) and [Supertest](https://github.com/visionmedia/supertest) out-of-the-box, and testing harness for unit testing and  end-to-end (e2e) test.

##  Nestjs test harness

Like the Angular 's `TestBed`, Nestjs provide a similar `Test` facilities to assemble the Nestjs components for your testing codes.

```typescript
beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ...
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

```

Similar to the attributes in the `@Module` decorator, `creatTestingModule` defines the components that will be used in the tests.

We have demonstrated the methods to test a service in Nestjs applications, eg. in the `post.service.spec.ts`.

To isolate the dependencies in a service,  there are several approaches.

* Create a fake service to replace the real service, assemble it in the `providers` .

  ```typescript
  providers: [
      {
          provide: UserService,
          useClass: FakeUserService
      }
  ],
  ```

* Use a mock instance instead.

  ```type
  providers: [
      provide: UserService,
      useValue: {
          send: jest.fn()
      }
  ],
  ```

* For simple service providers, you can escape from the Nestjs harness, and create a simple fake dependent service, and use `new` to instantize your service in the  `setup` hooks.

You can also import a module in `Test.createTestingModule`.

```typescript
Test.createTestingModule({
        imports: []
       })
```
To replace some service in the imported modules, you can `override` it.

```typescript
Test.createTestingModule({
        imports: []
       })
       .override(...)
```

## Jest Tips and Tricks

Nestjs testing is heavily dependent on Jest framework.  I have spent a lot of time to research testing all components in Nestjs applications.

### Mocking external classes or functions

For example the  `mongoose.connect` will require a real mongo server to connect, to mock the `createConnection` of `mongoose`.

Set up mocks before importing it.

```typescript
jest.mock('mongoose', () => ({
    createConnection: jest.fn().mockImplementation(
        (uri:any, options:any)=>({} as any)
    ),
    Connection: jest.fn()
}))

//...
import { Connection, createConnection } from 'mongoose';
//
```
When a database provider is instantized, assert the `createConnection` is called.

```typescript
it('connect is called', () => {
    //expect(conn).toBeDefined();
    //expect(createConnection).toHaveBeenCalledTimes(1); // it is 2 here. why?
    expect(createConnection).toHaveBeenCalledWith("mongodb://localhost/blog", {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        //see: https://mongoosejs.com/docs/deprecations.html#findandmodify
        useFindAndModify: false
    });
})
```

 ### Mock parent classes through prototype

Have a look at the local auth guard tests.

Mock the method `canActivate` in the parent  prototype.

```typescript
describe('LocalAuthGuard', () => {
  let guard: LocalAuthGuard;
  beforeEach(() => {
    guard = new LocalAuthGuard();
  });
  it('should be defined', () => {
    expect(guard).toBeDefined();
  });
  it('should return true for `canActivate`', async () => {
    AuthGuard('local').prototype.canActivate = jest.fn(() =>
      Promise.resolve(true),
    );
    AuthGuard('local').prototype.logIn = jest.fn(() => Promise.resolve());
    expect(await guard.canActivate({} as ExecutionContext)).toBe(true);
  });

});
```



### Extract the functionality into functions as possible

Let's have a look at the `user.model.ts`. Extract the pre `save` hook method and custom `comparePassword` method into standalone functions.

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

function comparePasswordMethod(password: string): Observable<boolean> {
  return from(compare(password, this.password));
}

UserSchema.methods.comparePassword = comparePasswordMethod;
```

It is easy to test them like simple functions.

```typescript
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



## End-to-end testing

Nestjs integrates supertest to send a request to the server side.

Use `beforeAll` and `afterAll` to start and stop the application,  use `request` to send a http request to the server and assert the response result.

```typescript
import * as request from 'supertest';
//...

describe('API endpoints testing (e2e)', () => {
    let app: INestApplication;
    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();
        app.enableShutdownHooks();
        app.useGlobalPipes(new ValidationPipe());
        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    // an example of using supertest reqruest.
    it('/posts (GET)', async () => {
        const res = await request(app.getHttpServer()).get('/posts').send();
        expect(res.status).toBe(200);
        expect(res.body.length).toEqual(3);
    });
}
```

More details for the complete e2e tests, check Nestjs 's [test folder](https://github.com/hantsy/nestjs-sample/tree/master/test).

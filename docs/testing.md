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

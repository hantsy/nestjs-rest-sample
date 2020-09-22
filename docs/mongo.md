# Connecting to MongoDB

In the last post , we created a RESTful API application for simple CRUD functionalities.  In this post, we will enrich it: 

*  Adding MongoDB support via Mongoose module
* Changing dummy data storage to use MongoDB server
* Cleaning up the testing codes 

Let's go.



## Adding MongooseModule

[MongoDB](https://www.mongodb.com) is  a leading document-based NoSQL database.  Nestjs has official support for MongoDB via  its [Mongoosejs](https://mongoosejs.com/) integration. 

Firstly, install the following dependencies.

```bash
npm install --save @nestjs/mongoose mongoose
npm install --save-dev @types/mongoose
```

Declare  a `MongooseModule ` in the top-level `AppModule` to activate Mongoose support.

```typescript
//... other imports
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
      //...other modules imports
      // add MongooseModule
      MongooseModule.forRoot('mongodb://localhost/blog')
  ],
  //... providers, controllers
})
export class AppModule {}
```

Mongoose requires a Schema definition to describe every document in MongoDB. Nestjs provides a simple to combine the schema definition and document POJO in the same form. 

Rename our former *post.interface.ts* to *post.model.ts*, the *.model* suffix means it is a Mongoose managed `Model`.

```typescript
import { SchemaFactory, Schema, Prop } from '@nestjs/mongoose';
import { Document } from 'mongoose';

@Schema()
export class Post extends Document {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true })
  content: string;

  @Prop()
  createdAt?: Date;

  @Prop()
  updatedAt?: Date;
}
export const PostSchema = SchemaFactory.createForClass(Post);
```

The annotations `@Schema`, `@Prop` defines the schema definitions on the document class instead of a [mongoose Schema](https://mongoosejs.com/docs/guide.html#definition) function.

Open `PostModule`,  declare a `posts` collection for storing `Post` document via importing a `MongooseModule.forFeature`.

```
import { PostSchema } from './post.model';
//other imports

@Module({
  imports: [MongooseModule.forFeature([{ name: 'posts', schema: PostSchema }])],
  // providers, controllers
})
export class PostModule {}
```



## Refactoring PostService 

When a Mongoose schema (eg. `PostSchame`) is mapped to a document collection(eg. `posts`), a Mongoose `Model` is ready for the operations of this collections in MongoDB.

Open *post.service.ts* file.

Change the content to the following:

```typescript
@Injectable()
export class PostService {
  constructor(@InjectModel('posts') private postModel: Model<Post>) {}

  findAll(keyword?: string, skip = 0, limit = 10): Observable<Post[]> {
    if (keyword) {
      return from(
        this.postModel
          .find({ title: { $regex: '.*' + keyword + '.*' } })
          .skip(skip)
          .limit(limit)
          .exec(),
      );
    } else {
      return from(
        this.postModel
          .find({})
          .skip(skip)
          .limit(limit)
          .exec(),
      );
    }
  }

  findById(id: string): Observable<Post> {
    return from(this.postModel.findOne({ _id: id }).exec());
  }

  save(data: CreatePostDto): Observable<Post> {
    const createPost = this.postModel.create({ ...data });
    return from(createPost);
  }

  update(id: string, data: UpdatePostDto): Observable<Post> {
    return from(this.postModel.findOneAndUpdate({ _id: id }, data).exec());
  }

  deleteById(id: string): Observable<Post> {
    return from(this.postModel.findOneAndDelete({ _id: id }).exec());
  }

  deleteAll(): Observable<any> {
    return from(this.postModel.deleteMany({}).exec());
  }
}

```

In the constructor of `PostService` class, use a `@InjectMock('posts')` to bind the `posts` collection to a parameterized Model handler.

The usage of all mongoose related functions can be found in [the official Mongoose docs](https://mongoosejs.com/docs/api/query.html).

As you see,  we also add two classes  `CreatePostDto` and `UpdatePostDto` instead of the original `Post` for the case of creating and updating posts. 

Following the principle [separation of concerns](https://en.wikipedia.org/wiki/Separation_of_concerns), `CreatePostDto` and `UpdatePostDto` are only used for transform data from client, add `readonly` modifier to keep the data *immutable* in the transforming progress. 

```typescript
// create-post.dto.ts
export class CreatePostDto {
  readonly title: string;
  readonly content: string;
}
// update-post.dto.ts
export class UpdatePostDto {
  readonly title: string;
  readonly content: string;
}
```

## Cleaning up PostController

Clean the `post.controller.ts` correspondingly.

```typescript
@Controller('posts')
export class PostController {
  constructor(private postService: PostService) {}

  @Get('')
  getAllPosts(
    @Query('q') keyword?: string,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit?: number,
    @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip?: number,
  ): Observable<BlogPost[]> {
    return this.postService.findAll(keyword, skip, limit);
  }

  @Get(':id')
  getPostById(@Param('id') id: string): Observable<BlogPost> {
    return this.postService.findById(id);
  }

  @Post('')
  createPost(@Body() post: CreatePostDto): Observable<BlogPost> {
    return this.postService.save(post);
  }

  @Put(':id')
  updatePost(
    @Param('id') id: string,
    @Body() post: UpdatePostDto,
  ): Observable<BlogPost> {
    return this.postService.update(id, post);
  }

  @Delete(':id')
  deletePostById(@Param('id') id: string): Observable<BlogPost> {
    return this.postService.deleteById(id);
  }
}
```

>  Unluckily, Mongoose APIs has no built-in Rxjs's `Observable`  support, if you are stick on Rxjs, you have to use `from` to wrap an existing `Promise` to Rxjs's `Observable`.  Check [this topic on stackoverflow to know more details about the difference bwteen Promise and Observable](https://stackoverflow.com/questions/37364973/what-is-the-difference-between-promises-and-observables).

## Run the application

To run the application, a  running MongoDB server is required. You can download a copy from [MongoDB](https://www.mongodb.com), and follow the [installation guide](https://docs.mongodb.com/manual/installation/) to install it into your system.

Simply, prepare a *docker-compose.yaml* to run the dependent servers in the development stage.

```yaml
version: '3.8' # specify docker-compose version

# Define the services/containers to be run
services:
        
  mongodb: 
    image: mongo 
    volumes:
      - mongodata:/data/db
    ports:
      - "27017:27017"
    networks:
      - backend   
     
volumes:
  mongodata:  

networks:
  backend:
```

Run the following command to start up a mongo service in a Docker container.

```bash
docker-compose up
```

Execute the following command in the project root folder to start up the application.

```bash
npm run start
```
Now open your terminal and use `curl` to test the endpoints, and make sure it works as expected.

```bash
>curl http://localhost:3000/posts/
[]
```

There is no sample data in the MongoDB. Utilizing with [the lifecycle events](https://docs.nestjs.com/fundamentals/lifecycle-events), it is easy to add some sample data for the test purpose.

```typescript
@Injectable()
export class DataInitializerService implements OnModuleInit, OnModuleDestroy {
  private data: CreatePostDto[] = [
    {
      title: 'Generate a NestJS project',
      content: 'content',
    },
    {
      title: 'Create CRUD RESTful APIs',
      content: 'content',
    },
    {
      title: 'Connect to MongoDB',
      content: 'content',
    },
  ];

  constructor(private postService: PostService) {}
  onModuleInit(): void {
    this.data.forEach(d => {
      this.postService.save(d).subscribe(saved => console.log(saved));
    });
  }
  onModuleDestroy(): void {
    console.log('module is be destroying...');
    this.postService
      .deleteAll()
      .subscribe(del => console.log(`deleted ${del} records.`));
  }

}
```
Register it in `PostModule`.

```typescript
//other imports
import { DataInitializerService } from './data-initializer.service';

@Module({
  //imports, controllers...
  providers: [//other services... 
  DataInitializerService],
})
export class PostModule {}
```
Run the application again. Now you will see some data when hinting *http://localhost:3000/posts/*.

```bash
>curl http://localhost:3000/posts/
[{"_id":"5ee49c3115a4e75254bb732e","title":"Generate a NestJS project","content":"content","__v":0},{"_id":"5ee49c3115a4e75254bb732f","title":"Create CRUD RESTful APIs","content":"content","__v":0},{"_id":"5ee49c3115a4e75254bb7330","title":"Connect to MongoDB","content":"content","__v":0}]

>curl http://localhost:3000/posts/5ee49c3115a4e75254bb732e
{"_id":"5ee49c3115a4e75254bb732e","title":"Generate a NestJS project","content":"content","__v":0}

>curl http://localhost:3000/posts/ -d "{\"title\":\"new post\",\"content\":\"content of my new post\"}" -H "Content-Type:application/json" -X POST
{"_id":"5ee49ca915a4e75254bb7331","title":"new post","content":"content of my new post","__v":0}

>curl http://localhost:3000/posts/5ee49ca915a4e75254bb7331 -d "{\"title\":\"my updated post\",\"content\":\"content of my new post\"}" -H "Content-Type:application/json" -X PUT
{"_id":"5ee49ca915a4e75254bb7331","title":"new post","content":"content of my new post","__v":0}

>curl http://localhost:3000/posts
[{"_id":"5ee49c3115a4e75254bb732e","title":"Generate a NestJS project","content":"content","__v":0},{"_id":"5ee49c3115a4e75254bb732f","title":"Create CRUD RESTful APIs","content":"content","__v":0},{"_id":"5ee49c3115a4e75254bb7330","title":"Connect to MongoDB","content":"content","__v":0},{"_id":"5ee49ca915a4e75254bb7331","title":"my updated post","content":"content of my new post","__v":0}]

>curl http://localhost:3000/posts/5ee49ca915a4e75254bb7331  -X DELETE
{"_id":"5ee49ca915a4e75254bb7331","title":"my updated post","content":"content of my new post","__v":0}

>curl http://localhost:3000/posts
[{"_id":"5ee49c3115a4e75254bb732e","title":"Generate a NestJS project","content":"content","__v":0},{"_id":"5ee49c3115a4e75254bb732f","title":"Create CRUD RESTful APIs","content":"content","__v":0},{"_id":"5ee49c3115a4e75254bb7330","title":"Connect to MongoDB","content":"content","__v":0}]
```

## Clean the testing codes

When switching to real data storage instead of the dummy array,  we face the first issue is how to treat with the Mongo database dependency in our *post.service.spec.ts*. 

Jest provides comprehensive mocking features to isolate the dependencies in test cases. Let's have a look at the whole content of  the refactored *post.service.spec.ts* file.

```typescript
describe('PostService', () => {
  let service: PostService;
  let model: Model<Post>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getModelToken('posts'),
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            exec: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findOneAndDelete: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<PostService>(PostService);
    model = module.get<Model<Post>>(getModelToken('posts'));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getAllPosts should return 3 posts', async () => {
    const posts = [
      {
        _id: '5ee49c3115a4e75254bb732e',
        title: 'Generate a NestJS project',
        content: 'content',
      },
      {
        _id: '5ee49c3115a4e75254bb732f',
        title: 'Create CRUD RESTful APIs',
        content: 'content',
      },
      {
        _id: '5ee49c3115a4e75254bb7330',
        title: 'Connect to MongoDB',
        content: 'content',
      },
    ];
    jest.spyOn(model, 'find').mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValueOnce(posts) as any,
        }),
      }),
    } as any);

    const data = await service.findAll().toPromise();
    expect(data.length).toBe(3);
  });

  it('getPostById with existing id should return 1 post', done => {
    const found = {
      _id: '5ee49c3115a4e75254bb732e',
      title: 'Generate a NestJS project',
      content: 'content',
    };

    jest.spyOn(model, 'findOne').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(found) as any,
    } as any);

    service.findById('1').subscribe({
      next: data => {
        expect(data._id).toBe('5ee49c3115a4e75254bb732e');
        expect(data.title).toEqual('Generate a NestJS project');
      },
      error: error => console.log(error),
      complete: done(),
    });
  });

  it('should save post', async () => {
    const toCreated = {
      title: 'test title',
      content: 'test content',
    };

    const toReturned = {
      _id: '5ee49c3115a4e75254bb732e',
      ...toCreated,
    };

    jest.spyOn(model, 'create').mockResolvedValue(toReturned as Post);

    const data = await service.save(toCreated).toPromise();
    expect(data._id).toBe('5ee49c3115a4e75254bb732e');
    expect(model.create).toBeCalledWith(toCreated);
    expect(model.create).toBeCalledTimes(1);
  });

  it('should update post', done => {
    const toUpdated = {
      _id: '5ee49c3115a4e75254bb732e',
      title: 'test title',
      content: 'test content',
    };

    jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce(toUpdated) as any,
    } as any);

    service.update('5ee49c3115a4e75254bb732e', toUpdated).subscribe({
      next: data => {
        expect(data._id).toBe('5ee49c3115a4e75254bb732e');
      },
      error: error => console.log(error),
      complete: done(),
    });
  });

  it('should delete post', done => {
    jest.spyOn(model, 'findOneAndDelete').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce({
        deletedCount: 1,
      }),
    } as any);

    service.deleteById('anystring').subscribe({
      next: data => expect(data).toBeTruthy,
      error: error => console.log(error),
      complete: done(),
    });
  });
});

```

In the above codes,

*  Use a custom *Provider* to provide a `PostModel` dependency for `PostService`, the Model is provided in `useValue` which hosted a mocked object instance for PostModel at runtime.
* In every test case, use `jest.spyOn` to assume some mocked behaviors of PostModel  happened before the service is executed.
*  You can use the `toBeCalledWith` like assertions on mocked object or spied object.

> For me, most of time working as a Java/Spring developers, constructing such a simple Jest based test is not easy, [jmcdo29/testing-nestjs](https://github.com/jmcdo29/testing-nestjs) is very helpful for me to jump into jest testing work.  
>
> The jest mock is every different from Mockito in Java. Luckily there is a ts-mockito which port Mockito to the Typescript world, check [this link](https://github.com/NagRock/ts-mockito) for more details .

OK, let's move to *post.controller.spec.ts*.

Similarly,   `PostController` depends on `PostService`.  To test the functionalities of `PostController`,  we should mock it.

Like the method we used in `post.service.spec.ts`, we can mock it in a `Provider`.

```typescript
describe('Post Controller(useValue jest mocking)', () => {
  let controller: PostController;
  let postService: PostService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PostService,
          useValue: {
            findAll: jest
              .fn()
              .mockImplementation(
                (_keyword?: string, _skip?: number, _limit?: number) =>
                  of<any[]>([
                    {
                      _id: 'testid',
                      title: 'test title',
                      content: 'test content',
                    },
                  ]),
              ),
          },
        },
      ],
      controllers: [PostController],
    }).compile();

    controller = module.get<PostController>(PostController);
    postService = module.get<PostService>(PostService);
  });

  it('should get all posts(useValue: jest mocking)', async () => {
    const result = await controller.getAllPosts('test', 10, 0).toPromise();
    expect(result[0]._id).toEqual('testid');
    expect(postService.findAll).toBeCalled();
    expect(postService.findAll).lastCalledWith('test', 0, 10);
  });
});
```

Instead of the jest mocking,  you can use a dummy implementation directly in the `Provider`.

```typescript
describe('Post Controller(useValue fake object)', () => {
  let controller: PostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PostService,
          useValue: {
            findAll: (_keyword?: string, _skip?: number, _limit?: number) =>
              of<any[]>([
                { _id: 'testid', title: 'test title', content: 'test content' },
              ]),
          },
        },
      ],
      controllers: [PostController],
    }).compile();

    controller = module.get<PostController>(PostController);
  });

  it('should get all posts(useValue: fake object)', async () => {
    const result = await controller.getAllPosts().toPromise();
    expect(result[0]._id).toEqual('testid');
  });
});
```

Or use fake class to replace the real `PostService` in the tests.

```typescript
class PostServiceFake {
  private posts = [
    {
      _id: '5ee49c3115a4e75254bb732e',
      title: 'Generate a NestJS project',
      content: 'content',
    },
    {
      _id: '5ee49c3115a4e75254bb732f',
      title: 'Create CRUD RESTful APIs',
      content: 'content',
    },
    {
      _id: '5ee49c3115a4e75254bb7330',
      title: 'Connect to MongoDB',
      content: 'content',
    },
  ];

  findAll() {
    return of(this.posts);
  }

  findById(id: string) {
    const { title, content } = this.posts[0];
    return of({ _id: id, title, content });
  }

  save(data: CreatePostDto) {
    return of({ _id: this.posts[0]._id, ...data });
  }

  update(id: string, data: UpdatePostDto) {
    return of({ _id: id, ...data });
  }

  deleteById(id: string) {
    return of({ ...this.posts[0], _id: id });
  }
}

describe('Post Controller', () => {
  let controller: PostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PostService,
          useClass: PostServiceFake,
        },
      ],
      controllers: [PostController],
    }).compile();

    controller = module.get<PostController>(PostController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('GET on /posts should return all posts', async () => {
    const posts = await controller.getAllPosts().toPromise();
    expect(posts.length).toBe(3);
  });

  it('GET on /posts/1 should return one post ', done => {
    controller.getPostById('1').subscribe(data => {
      expect(data._id).toEqual('1');
      done();
    });
  });

  it('POST on /posts should return all posts', async () => {
    const post: CreatePostDto = {
      title: 'test title',
      content: 'test content',
    };
    const saved = await controller.createPost(post).toPromise();
    expect(saved.title).toEqual('test title');
  });

  it('PUT on /posts/1 should return all posts', done => {
    const post: UpdatePostDto = {
      title: 'test title',
      content: 'test content',
    };
    controller.updatePost('1', post).subscribe(data => {
      expect(data.title).toEqual('test title');
      expect(data.content).toEqual('test content');
      done();
    });
  });

  it('DELETE on /posts/1 should return true', done => {
    controller.deletePostById('1').subscribe(data => {
      expect(data).toBeTruthy();
      done();
    });
  });
});
```

The above codes are more close the ones in the first article, it is simple and easy to understand.  

> To ensure the fake PostService has the exact method signature of the real PostService, it is better to use an interface to define the methods if you prefer this apporach.

I have mentioned *ts-mockito*, for me it is easier to boost up a Mockito like test.

```bash
npm install --save-dev ts-mockito
```
A simple mockito based test looks like this.

```typescript
// import facilites from ts-mockito
import { mock, verify, instance, anyString, anyNumber, when } from 'ts-mockito';

describe('Post Controller(using ts-mockito)', () => {
  let controller: PostController;
  const mockedPostService: PostService = mock(PostService);

  beforeEach(async () => {
    controller = new PostController(instance(mockedPostService));
  });

  it('should get all posts(ts-mockito)', async () => {
    when(
      mockedPostService.findAll(anyString(), anyNumber(), anyNumber()),
    ).thenReturn(
      of([
        { _id: 'testid', title: 'test title', content: 'content' },
      ]) as Observable<Post[]>,
    );
    const result = await controller.getAllPosts('', 10, 0).toPromise();
    expect(result.length).toEqual(1);
    expect(result[0].title).toBe('test title');
    verify(
      mockedPostService.findAll(anyString(), anyNumber(), anyNumber()),
    ).once();
  });
});
```
Now run the tests again. All tests should pass. 

```bash
> npm run test

...

 PASS  src/app.controller.spec.ts
 PASS  src/post/post.service.spec.ts (10.307 s)
 PASS  src/post/post.controller.spec.ts (10.471 s)

Test Suites: 3 passed, 3 total
Tests:       17 passed, 17 total
Snapshots:   0 total
Time:        11.481 s, estimated 12 s
Ran all test suites.
```

In this post, we connected to the real MongoDB instead of the dummy data storage, correspond to the changes , we have refactored all tests, and discuss some approaches to isolate the dependencies in tests.  But we have not test all functionalities in a real integrated environment,  Nestjs provides e2e testing skeleton, we will discuss it in a future post.

Grab [the source codes from my github](https://github.com/hantsy/nestjs-sample), switch to branch [feat/mongo](https://github.com/hantsy/nestjs-sample/blob/feat/mongo).


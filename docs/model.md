# Dealing with model relations

We have added authentication in our application in the last post,  you maybe have a question, can I  add some fields to `Post` document and remember the user who created it and the one who updated it at the last time.

When I come to the `Post` model, and try to add fields to setup the auditors, I can not find a simple way to do this. After researching and consulting from the Nestjs channel in Discord, I was told that the `@nestjs/mongoose` can not deal with the relations between Documents.

There are some suggestions I got from the community.

* Use  [Typegoose](https://github.com/typegoose/typegoose) instead of `@nestjs/mongoose`, check the [typegoose doc](https://typegoose.github.io/typegoose/) for more details. More effectively, there is a [nestjs-typegoose](https://github.com/kpfromer/nestjs-typegoose) to assist you to bridge typegoose to the Nestjs world.
* Give up `@nestjs/mongoose`  and turn back to use the raw `mongoose` APIs instead.

I have some experience of express and mongoose written in legacy ES5, so in this post I will try to switch to use the pure Mongoose API to replace the modeling codes we have done in the previous post. With the help  of `@types/mongoose`, it is easy to apply static types on the mongoose schemas , documents and models.

## Redefining the models with Mongoose API

We will follow the following steps to clean the codes of  models one by one .

1. Clean the document definition interface.
2.  Redefine the schema for related documents using Mongoose APIs.
3. Define mongoose Models and provide them in the Nestjs IOC engine. 
4. Create a custom provider for connecting to Mongo  using Mongoose APIs.
5. Remove the `@nestjs/mongoose` dependency finally.

Firstly let's have a look at `Post`, in the `post.model.ts`, fill the following content:

```typescript
import { Document, Schema, SchemaTypes } from 'mongoose';
import { User } from './user.model';

export interface Post extends Document {
  readonly title: string;
  readonly content: string;
  readonly createdBy?: Partial<User>;
  readonly updatedBy?: Partial<User>;
}

export const PostSchema = new Schema(
  {
    title: SchemaTypes.String,
    content: SchemaTypes.String,
    createdBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
    updatedBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true },
);
```

The `PostSchema` is defined by type-safe way, all supports can be found in `SchemeTypes` while navigating it.  The `createdBy` and `updatedBy` is a reference of `User` document. The `{ timestamps: true }` will append `createdAt` and `updatedAt` to  the document  and fill these two fields the current timestamp automatically  when saving and updating the documents.

Create a `database.providers.ts` file to declare the `Post` model. We also create a provider for Mongo connection.

```typescript
import { PostSchema, Post } from './post.model';
import {
  DATABASE_CONNECTION,
  POST_MODEL
} from './database.constants';

export const databaseProviders = [
  {
    provide: DATABASE_CONNECTION,
    useFactory: (): Promise<typeof mongoose> =>
      connect('mongodb://localhost/blog', {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }),
  },
  {
    provide: POST_MODEL,
    useFactory: (connection: Connection) =>
      connection.model<Post>('Post', PostSchema, 'posts'),
    inject: [DATABASE_CONNECTION],
  },
//...
];

```

> More info about creating custom providers, check the [custom providers](https://docs.nestjs.com/fundamentals/custom-providers) chapter of the official docs.

For the convenience of using the injection token, create a `database.constant.ts` file to define series of constants for further uses.

```type
export const DATABASE_CONNECTION = 'DATABASE_CONNECTION';
export const POST_MODEL = 'POST_MODEL';
export const USER_MODEL = 'USER_MODEL';
export const COMMENT_MODEL = 'COMMENT_MODEL';
```

Create  a `database.module.ts` file, and define a  `Module` to collect the Mongoose related resources.

```typescript
@Module({
  providers: [...databaseProviders],
  exports: [...databaseProviders],
})
export class DatabaseModule {}
```

To better organize the codes, move all model  related codes into the `database` folder.

Import `DatabaseModule` in the `AppModule`.

```typescript
@Module({
  imports: [
    DatabaseModule,
//...
})
export class AppModule {}
```

Now in the `post.service.ts`, change the injecting `Model<Post>` to the following.

```typesc
 constructor(
    @Inject(POST_MODEL) private postModel: Model<Post>,
    //...
    ){...}
```

In the test, change the injection token from class name to the constant value we defined, eg. 

```typescript
module.get<Model<Post>>(POST_MODEL)
```

Similarly, update the `user.model.ts` and related codes.

```typescript
//database/user.model.ts
export interface User extends Document {
  readonly username: string;
  readonly email: string;
  readonly password: string;
  readonly firstName?: string;
  readonly lastName?: string;
  readonly roles?: RoleType[];
}

const UserSchema = new Schema(
  {
    username: SchemaTypes.String,
    password: SchemaTypes.String,
    email: SchemaTypes.String,
    firstName: { type: SchemaTypes.String, required: false },
    lastName: { type: SchemaTypes.String, required: false },
    roles: [
      { type: SchemaTypes.String, enum: ['ADMIN', 'USER'], required: false },
    ],
    //   createdAt: { type: SchemaTypes.Date, required: false },
    //   updatedAt: { type: SchemaTypes.Date, required: false },
  },
  { timestamps: true },
);

UserSchema.virtual('name').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

export const userModelFn = (conn: Connection) =>
  conn.model<User>('User', UserSchema, 'users');


//database/role-type.enum.ts
export enum RoleType {
  ADMIN = 'ADMIN',
  USER = 'USER',
}

//database/database.providers.ts
export const databaseProviders = [
    //...
  {
    provide: USER_MODEL,
    useFactory: (connection: Connection) => userModelFn(connection),
    inject: [DATABASE_CONNECTION],
  },
];

//user/user.service.ts
@Injectable()
export class UserService {
  constructor(@Inject(USER_MODEL) private userModel: Model<User>) {}
  //...	
}
```

Create  another model `Comment`, as sub document of `Post`. A comment holds a reference of Post doc.

```typescript
export interface Comment extends Document {
  readonly content: string;
  readonly post?: Partial<Post>;
  readonly createdBy?: Partial<User>;
  readonly updatedBy?: Partial<User>;
}

export const CommentSchema = new Schema(
  {
    content: SchemaTypes.String,
    post: { type: SchemaTypes.ObjectId, ref: 'Post', required: false },
    createdBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
    updatedBy: { type: SchemaTypes.ObjectId, ref: 'User', required: false },
  },
  { timestamps: true },
);
```

Register it in `databaseProviders`.

```typescript
export const databaseProviders = [
  //...
  {
    provide: COMMENT_MODEL,
    useFactory: (connection: Connection) =>
      connection.model<Post>('Comment', CommentSchema, 'comments'),
    inject: [DATABASE_CONNECTION],
  },
 ]
```

Update the `PostService` ,  add two methods.

```typescript
//post/post.service.ts
export class PostService {
  constructor(
    @Inject(POST_MODEL) private postModel: Model<Post>,
    @Inject(COMMENT_MODEL) private commentModel: Model<Comment>
  ) {}
    //...
    //  actions for comments
  createCommentFor(id: string, data: CreateCommentDto): Observable<Comment> {
    const createdComment = this.commentModel.create({
      post: { _id: id },
      ...data,
      createdBy: { _id: this.req.user._id },
    });
    return from(createdComment);
  }

  commentsOf(id: string): Observable<Comment[]> {
    const comments = this.commentModel
      .find({
        post: { _id: id },
      })
      .select('-post')
      .exec();
    return from(comments);
  }
}    
```

The `CreateCommentDto` is a POJO to collect the data from request body.

```typescript
//post/create-comment.dto.ts
export class CreateCommentDto {
  readonly content: string;
}
```

Open `PostController`,  add two methods.

```typescript
export class PostController {
  constructor(private postService: PostService) {}

  //...
  @Post(':id/comments')
  createCommentForPost(
    @Param('id') id: string,
    @Body() data: CreateCommentDto,
  ): Observable<Comment> {
    return this.postService.createCommentFor(id, data);
  }

  @Get(':id/comments')
  getAllCommentsOfPost(@Param('id') id: string): Observable<Comment[]> {
    return this.postService.commentsOf(id);
  }
}
```

In the last post, we created authentication, to protect the saving and updating operations, you can set `JwtGuard` on the methods of the controllers.

But if we want to control the access in details, we need to consider `Authorization`, most of time, it is simple to implement it by introducing RBAC. 

## Role based access control

Assume there are two roles defined in this application, `USER` and `ADMIN`. In fact, we have already defined an enum class to archive this purpose.

Nestjs provide a simple way to set metadata by decorator on methods. 

```typescript
import { SetMetadata } from '@nestjs/common';
import { RoleType } from '../database/role-type.enum';
import { HAS_ROLES_KEY } from './auth.constants';

export const HasRoles = (...args: RoleType[]) => SetMetadata(HAS_ROLES_KEY, args);
```

Create specific `Guard` to read the metadata and compare the user object in request and decide if allow  user to access the controlled resources.

```typescript
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const roles = this.reflector.get<RoleType[]>(
      HAS_ROLES_KEY,
      context.getHandler(),
    );
    if (!roles) {
      return true;
    }

    const { user }= context.switchToHttp().getRequest() as AuthenticatedRequest;
    return user.roles && user.roles.some(r => roles.includes(r));
  }
}
```

For example, we require a  `USER`  role to create  a `Post` document.

```typescript
export class PostController {
  constructor(private postService: PostService) {}
    
  @Post('')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @HasRoles(RoleType.USER, RoleType.ADMIN)
  createPost(@Body() post: CreatePostDto): Observable<BlogPost> {
    //...
  }
    
}    
```

You can add other rules on the resource access, such as a `USER` role is required to update a ` Post`, and  `ADMIN`  is to delete a `Post`.

## Adding auditing info

We have added roles to control access the resources, now we can save the current user who is creating the post or update the post.

There is a barrier when we wan to read the authenticated user from request and set it to fields `createdBy` and `updatedBy` in `PostService`, the `PostService` is singleton scoped, you can not inject a request in it.  But you can declare the `PostService` is `REQUEST` scoped, thus injecting a request instance is possible.

```typescript
@Injectable({ scope: Scope.REQUEST })
export class PostService {
  constructor(
    @Inject(POST_MODEL) private postModel: Model<Post>,
    @Inject(COMMENT_MODEL) private commentModel: Model<Comment>,
    @Inject(REQUEST) private req: AuthenticatedRequest,
  ) {}
    
  //...
  save(data: CreatePostDto): Observable<Post> {
    const createPost = this.postModel.create({
      ...data,
      createdBy: { _id: this.req.user._id },
    });
    return from(createPost);
  }
 
  update(id: string, data: UpdatePostDto): Observable<Post> {
    return from(
      this.postModel
        .findOneAndUpdate(
          { _id: id },
          { ...data, updatedBy: { _id: this.req.user._id } },
        )
        .exec(),
    );
  }
 
 //  actions for comments
  createCommentFor(id: string, data: CreateCommentDto): Observable<Comment> {
    const createdComment = this.commentModel.create({
      post: { _id: id },
      ...data,
      createdBy: { _id: this.req.user._id },
    });
    return from(createdComment);
  }    
}    
```

As a convention in Nestjs, you have to make `PostController` available in the `REQUEST` scoped.

```typescript
@Controller({path:'posts', scope:Scope.REQUEST})
export class PostController {...}
```

In the test codes, you have to `resolve` to replace `get` to get the instance from Nestjs test harness.

```typescript
describe('Post Controller', () => {
  describe('Replace PostService in provider(useClass: PostServiceStub)', () => {
    let controller: PostController;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: PostService,
            useClass: PostServiceStub,
          },
        ],
        controllers: [PostController],
      }).compile();

      controller = await module.resolve<PostController>(PostController);// use resovle here....
    });
  ...
```

`PostService` also should be  changed to request scoped. 

```typescript
@Injectable({ scope: Scope.REQUEST })
export class PostService {...}
```

In the `post.service.spec.ts` , you have to update the mocking progress.

```typescript
describe('PostService', () => {
  let service: PostService;
  let model: Model<Post>;
  let commentModel: Model<Comment>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: POST_MODEL,
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            exec: jest.fn(),
            deleteMany: jest.fn(),
            deleteOne: jest.fn(),
            updateOne: jest.fn(),
            findOneAndUpdate: jest.fn(),
            findOneAndDelete: jest.fn(),
          },
        },
        {
          provide: COMMENT_MODEL,
          useValue: {
            new: jest.fn(),
            constructor: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            updateOne: jest.fn(),
            deleteOne: jest.fn(),
            update: jest.fn(),
            create: jest.fn(),
            remove: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: REQUEST,
          useValue: {
            user: {
              id: 'dummyId',
            },
          },
        },
      ],
    }).compile();

    service = await module.resolve<PostService>(PostService);
    model = module.get<Model<Post>>(POST_MODEL);
    commentModel = module.get<Model<Comment>>(COMMENT_MODEL);
  });
    
//...
```



## Run the application

Now we have done the clean work, run the application to make sure it works as expected.

```bash
> npm run start
```

Use `curl` to test the endpoints provided in the application.


```bash

$ curl http://localhost:3000/auth/login -d "{\"username\":\"hantsy\",\"password\":\"password\"}" -H "Content-Type:application/json" 

{"access_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cG4iOiJoYW50c3kiLCJzdWIiOiI1ZWYwYjdkNTRkMDY3MzIxMTQxODQ1ZjYiLCJlbWFpbCI6ImhhbnRzeUBleGFtcGxlLmNvbSIsInJvbGVzIjpbIlVTRVIiXSwiaWF0IjoxNTkyODM0MDE3LCJleHAiOjE1OTI4Mzc2MTd9.Jx53KIWHgyPADhLr-LhjW-iu1e8hD650e9nduGgJ8Bw"}

$ curl -X POST http://localhost:3000/posts -d "{\"title\":\"my title\",\"content\":\"my content\"}" -H "Content-Type:application/json" -H "Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cG4iOiJoYW50c3kiLCJzdWIiOiI1ZWYwYjdkNTRkMDY3MzIxMTQxODQ1ZjYiLCJlbWFpbCI6ImhhbnRzeUBleGFtcGxlLmNvbSIsInJvbGVzIjpbIlVTRVIiXSwiaWF0IjoxNTkyODM0MDE3LCJleHAiOjE1OTI4Mzc2MTd9.Jx53KIWHgyPADhLr-LhjW-iu1e8hD650e9nduGgJ8Bw"

{"_id":"5ef0b7fe4d067321141845fc","title":"my title","content":"my content","createdBy":"5ef0b7d54d067321141845f6","createdAt":"2020-06-22T13:54:06.873Z","updatedAt":"2020-06-22T13:54:06.873Z","__v":0}

$ curl -X POST http://localhost:3000/posts/5ef0b7fe4d067321141845fc/comments -d "{\"content\":\"my content\"}" -H "Content-Type:application/json" -H "Authorization:Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1cG4iOiJoYW50c3kiLCJzdWIiOiI1ZWYwYjdkNTRkMDY3MzIxMTQxODQ1ZjYiLCJlbWFpbCI6ImhhbnRzeUBleGFtcGxlLmNvbSIsInJvbGVzIjpbIlVTRVIiXSwiaWF0IjoxNTkyODM0MDE3LCJleHAiOjE1OTI4Mzc2MTd9.Jx53KIWHgyPADhLr-LhjW-iu1e8hD650e9nduGgJ8Bw"

{"_id":"5ef0b8414d067321141845fd","post":"5ef0b7fe4d067321141845fc","content":"my content","createdBy":"5ef0b7d54d067321141845f6","createdAt":"2020-06-22T13:55:13.822Z","updatedAt":"2020-06-22T13:55:13.822Z","__v":0}

$ curl http://localhost:3000/posts/5ef0b7fe4d067321141845fc/comments
[{"_id":"5ef0b8414d067321141845fd","content":"my content","createdBy":"5ef0b7d54d067321141845f6","createdAt":"2020-06-22T13:55:13.822Z","updatedAt":"2020-06-22T13:55:13.822Z","__v":0}]

```

## One last thing

After cleaning up the codes, we do not need the  `@nestjs/mongoose` dependency, let's remove it.

```bash
npm uninstall --save @nestjs/mongoose
```

Grab [the source codes from my github](https://github.com/hantsy/nestjs-sample), switch to branch [feat/model](https://github.com/hantsy/nestjs-sample/blob/feat/model).
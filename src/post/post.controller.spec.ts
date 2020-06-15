import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CreatePostDto } from './create-post.dto';
import { UpdatePostDto } from './update-post.dto';
import { of, Observable } from 'rxjs';
import { mock, verify, instance, anyString, anyNumber, when } from 'ts-mockito';
import { Post } from './post.model';

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

describe('Post Controller(useValue fake object)', () => {
  let controller: PostController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        {
          provide: PostService,
          useValue: {
            findAll: () =>
              of<any[]>([
                { _id: 'testid', title: 'title', content: 'test content' },
              ]),
          },
        },
      ],
      controllers: [PostController],
    }).compile();

    controller = module.get<PostController>(PostController);
  });

  it('should get all posts', async () => {
    const result = await controller.getAllPosts().toPromise();
    expect(result[0]._id).toEqual('testid');
  });
});


describe('Post Controller(useValue: fake object)', () => {
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

describe('Post Controller(useValue: jest mocked object)', () => {
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

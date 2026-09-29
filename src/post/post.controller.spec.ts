import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom, Observable, of } from 'rxjs';
import { Response } from 'express';
import { Post } from '../database/post.model';
import { CreatePostDto } from './create-post.dto';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostServiceStub } from './post.service.stub';
import { UpdatePostDto } from './update-post.dto';

function createMockResponse(overrides: Record<string, any> = {}): Response {
  const res: any = {
    location: vi.fn().mockReturnThis(),
    status: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    headers: {},
    ...overrides,
  };
  if (overrides.location) {
    res.location = overrides.location;
  }
  if (overrides.status) {
    res.status = overrides.status;
  }
  return res as Response;
}

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

      controller = await module.resolve<PostController>(PostController);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('GET on /posts should return all posts', async () => {
      const posts = await lastValueFrom(controller.getAllPosts());
      expect(posts.length).toBe(3);
    });

    it('GET on /posts/:id should return one post ', async () => {
      const data = await lastValueFrom(controller.getPostById('1'));
      expect(data._id).toEqual('1');
    });

    it('POST on /posts should save post', async () => {
      const post: CreatePostDto = {
        title: 'test title',
        content: 'test content',
      };
      const saved = await lastValueFrom(
        controller.createPost(
          post,
          createMockResponse({
            location: vi.fn().mockReturnValue({
              status: vi.fn().mockReturnValue({
                send: vi.fn().mockReturnValue({
                  headers: { location: '/posts/post_id' },
                  status: 201,
                }),
              }),
            }),
          }),
        ),
      );
      expect(saved.status).toBe(201);
    });

    it('PUT on /posts/:id should update the existing post', async () => {
      const post: UpdatePostDto = {
        title: 'test title',
        content: 'test content',
      };
      const data = await lastValueFrom(
        controller.updatePost(
          '1',
          post,
          createMockResponse({
            status: vi.fn().mockReturnValue({
              send: vi.fn().mockReturnValue({
                status: 204,
              }),
            }),
          }),
        ),
      );
      expect(data.status).toBe(204);
    });

    it('DELETE on /posts/:id should delete post', async () => {
      const data = await lastValueFrom(
        controller.deletePostById(
          '1',
          createMockResponse({
            status: vi.fn().mockReturnValue({
              send: vi.fn().mockReturnValue({
                status: 204,
              }),
            }),
          }),
        ),
      );
      expect(data).toBeTruthy();
    });

    it('POST on /posts/:id/comments', async () => {
      const result = await lastValueFrom(
        controller.createCommentForPost(
          'testpost',
          { content: 'testcomment' },
          createMockResponse({
            location: vi.fn().mockReturnValue({
              status: vi.fn().mockReturnValue({
                send: vi.fn().mockReturnValue({
                  headers: { location: '/posts/post_id/comments/comment_id' },
                  status: 201,
                }),
              }),
            }),
          }),
        ),
      );

      expect(result.status).toBe(201);
    });

    it('GET on /posts/:id/comments', async () => {
      const result = await lastValueFrom(
        controller.getAllCommentsOfPost('testpost'),
      );

      expect(result.length).toBe(1);
    });
  });

  describe('Replace PostService in provider(useValue: fake object)', () => {
    let controller: PostController;
    const id = '5ee49c3115a4e75254bb732e';

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: PostService,
            useValue: {
              findAll: (_keyword?: string, _skip?: number, _limit?: number) =>
                of<any[]>([
                  {
                    _id: id,
                    title: 'test title',
                    content: 'test content',
                  },
                ]),
            },
          },
        ],
        controllers: [PostController],
      }).compile();

      controller = await module.resolve<PostController>(PostController);
    });

    it('should get all posts(useValue: fake object)', async () => {
      const result = await lastValueFrom(controller.getAllPosts());
      expect(result[0]._id).toEqual(id);
    });
  });

  describe('Replace PostService in provider(useValue: vi mocked object)', () => {
    let controller: PostController;
    let postService: PostService;
    const id = '5ee49c3115a4e75254bb732e';

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: PostService,
            useValue: {
              constructor: vi.fn(),
              findAll: vi
                .fn()
                .mockImplementation(
                  (_keyword?: string, _skip?: number, _limit?: number) =>
                    of<any[]>([
                      {
                        _id: id,
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

      controller = await module.resolve<PostController>(PostController);
      postService = module.get<PostService>(PostService);
    });

    it('should get all posts(useValue: vi mocking)', async () => {
      const keyword = 'test';
      const result = await lastValueFrom(
        controller.getAllPosts(keyword, 10, 0),
      );
      expect(result[0]._id).toEqual(id);
      expect(postService.findAll).toHaveBeenCalled();
      expect(postService.findAll).toHaveBeenLastCalledWith(keyword, 0, 10);
    });
  });

  describe('Mocking PostService using vi.fn()', () => {
    let controller: PostController;
    const findAllMock = vi.fn();
    const mockedPostService = {
      findAll: findAllMock,
    } as unknown as PostService;

    beforeEach(() => {
      controller = new PostController(mockedPostService);
      findAllMock.mockReset();
    });

    it('should get all posts(vi.fn)', async () => {
      findAllMock.mockReturnValue(
        of([
          {
            _id: '5ee49c3115a4e75254bb732e',
            title: 'test title',
            content: 'content',
          },
        ]) as unknown as Observable<Post[]>,
      );
      const result = await lastValueFrom(controller.getAllPosts('', 10, 0));
      expect(result.length).toEqual(1);
      expect(result[0].title).toBe('test title');
      expect(findAllMock).toHaveBeenCalledTimes(1);
    });
  });
});

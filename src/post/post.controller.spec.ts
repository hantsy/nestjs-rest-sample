import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom, Observable, of } from 'rxjs';
import { anyNumber, anyString, instance, mock, verify, when } from 'ts-mockito';
import { Post } from '../database/post.model';
import { CreatePostDto } from './create-post.dto';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { PostServiceStub } from './post.service.stub';
import { UpdatePostDto } from './update-post.dto';
import { createMock } from '@golevelup/ts-jest';
import { Response } from 'express';

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

    it('GET on /posts/:id should return one post ', (done) => {
      controller.getPostById('1').subscribe((data) => {
        expect(data._id).toEqual('1');
        done();
      });
    });

    it('POST on /posts should save post', async () => {
      const post: CreatePostDto = {
        title: 'test title',
        content: 'test content',
      };
      const saved = await lastValueFrom(
        controller.createPost(
          post,
          createMock<Response>({
            location: jest.fn().mockReturnValue({
              status: jest.fn().mockReturnValue({
                send: jest.fn().mockReturnValue({
                  headers: { location: '/posts/post_id' },
                  status: 201,
                }),
              }),
            }),
          }),
        ),
      );
      // console.log(saved);
      expect(saved.status).toBe(201);
    });

    it('PUT on /posts/:id should update the existing post', (done) => {
      const post: UpdatePostDto = {
        title: 'test title',
        content: 'test content',
      };
      controller
        .updatePost(
          '1',
          post,
          createMock<Response>({
            status: jest.fn().mockReturnValue({
              send: jest.fn().mockReturnValue({
                status: 204,
              }),
            }),
          }),
        )
        .subscribe((data) => {
          expect(data.status).toBe(204);
          done();
        });
    });

    it('DELETE on /posts/:id should delete post', (done) => {
      controller
        .deletePostById(
          '1',
          createMock<Response>({
            status: jest.fn().mockReturnValue({
              send: jest.fn().mockReturnValue({
                status: 204,
              }),
            }),
          }),
        )
        .subscribe((data) => {
          expect(data).toBeTruthy();
          done();
        });
    });

    it('POST on /posts/:id/comments', async () => {
      const result = await lastValueFrom(
        controller.createCommentForPost(
          'testpost',
          { content: 'testcomment' },
          createMock<Response>({
            location: jest.fn().mockReturnValue({
              status: jest.fn().mockReturnValue({
                send: jest.fn().mockReturnValue({
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

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: PostService,
            useValue: {
              findAll: (_keyword?: string, _skip?: number, _limit?: number) =>
                of<any[]>([
                  {
                    _id: 'testid',
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
      expect(result[0]._id).toEqual('testid');
    });
  });

  describe('Replace PostService in provider(useValue: jest mocked object)', () => {
    let controller: PostController;
    let postService: PostService;

    beforeEach(async () => {
      const module: TestingModule = await Test.createTestingModule({
        providers: [
          {
            provide: PostService,
            useValue: {
              constructor: jest.fn(),
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

      controller = await module.resolve<PostController>(PostController);
      postService = module.get<PostService>(PostService);
    });

    it('should get all posts(useValue: jest mocking)', async () => {
      const result = await lastValueFrom(controller.getAllPosts('test', 10, 0));
      expect(result[0]._id).toEqual('testid');
      expect(postService.findAll).toBeCalled();
      expect(postService.findAll).lastCalledWith('test', 0, 10);
    });
  });

  describe('Mocking PostService using ts-mockito', () => {
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
      const result = await lastValueFrom(controller.getAllPosts('', 10, 0));
      expect(result.length).toEqual(1);
      expect(result[0].title).toBe('test title');
      verify(
        mockedPostService.findAll(anyString(), anyNumber(), anyNumber()),
      ).once();
    });
  });
});

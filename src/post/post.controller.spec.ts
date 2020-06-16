import { Test, TestingModule } from '@nestjs/testing';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CreatePostDto } from './create-post.dto';
import { UpdatePostDto } from './update-post.dto';
import { of, Observable } from 'rxjs';
import { mock, verify, instance, anyString, anyNumber, when } from 'ts-mockito';
import { Post } from './post.model';
import { PostServiceStub } from './post.service.stub';

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

      controller = module.get<PostController>(PostController);
    });

    it('should be defined', () => {
      expect(controller).toBeDefined();
    });

    it('GET on /posts should return all posts', async () => {
      const posts = await controller.getAllPosts().toPromise();
      expect(posts.length).toBe(3);
    });

    it('GET on /posts/:id should return one post ', done => {
      controller.getPostById('1').subscribe(data => {
        expect(data._id).toEqual('1');
        done();
      });
    });

    it('POST on /posts should save post', async () => {
      const post: CreatePostDto = {
        title: 'test title',
        content: 'test content',
      };
      const saved = await controller.createPost(post).toPromise();
      expect(saved.title).toEqual('test title');
    });

    it('PUT on /posts/:id should update the existing post', done => {
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

    it('DELETE on /posts/:id should delete post', done => {
      controller.deletePostById('1').subscribe(data => {
        expect(data).toBeTruthy();
        done();
      });
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

      controller = module.get<PostController>(PostController);
    });

    it('should get all posts(useValue: fake object)', async () => {
      const result = await controller.getAllPosts().toPromise();
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
      const result = await controller.getAllPosts('', 10, 0).toPromise();
      expect(result.length).toEqual(1);
      expect(result[0].title).toBe('test title');
      verify(
        mockedPostService.findAll(anyString(), anyNumber(), anyNumber()),
      ).once();
    });
  });
});

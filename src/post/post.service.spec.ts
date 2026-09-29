import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { Model, Types } from 'mongoose';
import { lastValueFrom } from 'rxjs';

import { Comment } from '../database/comment.model';
import { COMMENT_MODEL, POST_MODEL } from '../database/database.constants';
import { Post } from '../database/post.model';
import { PostService } from './post.service';
import { CreatePostDto } from './create-post.dto';

describe('PostService', () => {
  let service: PostService;
  let model: Model<Post>;
  let commentModel: Model<Comment>;

  const TEST_USER_ID = new Types.ObjectId('605c39f4bcf86cd799439011');

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: POST_MODEL,
          useValue: {
            new: vi.fn(),
            constructor: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
            remove: vi.fn(),
            exec: vi.fn(),
            deleteMany: vi.fn(),
            deleteOne: vi.fn(),
            updateOne: vi.fn(),
            findOneAndUpdate: vi.fn(),
            findOneAndDelete: vi.fn(),
          },
        },
        {
          provide: COMMENT_MODEL,
          useValue: {
            new: vi.fn(),
            constructor: vi.fn(),
            find: vi.fn(),
            findOne: vi.fn(),
            updateOne: vi.fn(),
            deleteOne: vi.fn(),
            update: vi.fn(),
            create: vi.fn(),
            remove: vi.fn(),
            exec: vi.fn(),
          },
        },
        {
          provide: REQUEST,
          useValue: {
            user: {
              id: '605c39f4bcf86cd799439011',
            },
          },
        },
      ],
    }).compile();

    service = await module.resolve<PostService>(PostService);
    model = module.get<Model<Post>>(POST_MODEL);
    commentModel = module.get<Model<Comment>>(COMMENT_MODEL);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findAll should return all posts', async () => {
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
    vi.spyOn(model, 'find').mockReturnValue({
      skip: vi.fn().mockReturnValue({
        limit: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValueOnce(posts) as any,
        }),
      }),
    } as any);

    const data = await lastValueFrom(service.findAll());
    expect(data.length).toBe(3);
    expect(model.find).toHaveBeenCalled();

    vi.spyOn(model, 'find').mockImplementation(() => {
      return {
        skip: vi.fn().mockReturnValue({
          limit: vi.fn().mockReturnValue({
            exec: vi.fn().mockResolvedValueOnce([posts[0]]),
          }),
        }),
      } as any;
    });

    const result = await lastValueFrom(service.findAll('Generate', 0, 10));
    expect(result.length).toBe(1);
    expect(model.find).toHaveBeenLastCalledWith({
      title: { $regex: '.*' + 'Generate' + '.*' },
    });
  });

  describe('findByid', () => {
    it('if exists return one post', async () => {
      const found = {
        _id: '5ee49c3115a4e75254bb732e',
        title: 'Generate a NestJS project',
        content: 'content',
      };

      vi.spyOn(model, 'findOne').mockReturnValue({
        exec: vi.fn().mockResolvedValueOnce(found) as any,
      } as any);

      const data = await lastValueFrom(service.findById('1'));
      expect(data._id).toBe('5ee49c3115a4e75254bb732e');
      expect(data.title).toEqual('Generate a NestJS project');
    });

    it('if not found throw an NotFoundException', async () => {
      vi.spyOn(model, 'findOne').mockReturnValue({
        exec: vi.fn().mockResolvedValueOnce(null) as any,
      } as any);

      try {
        await lastValueFrom(service.findById('1'));
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  it('should save post', async () => {
    const toCreated = {
      title: 'test title',
      content: 'test content',
    } as unknown as CreatePostDto;

    const toReturned = {
      _id: '5ee49c3115a4e75254bb732e',
      ...toCreated,
    } as any;

    vi.spyOn(model, 'create').mockImplementation(() =>
      Promise.resolve(toReturned),
    );

    const data = await lastValueFrom(service.save(toCreated));
    expect(data._id).toBe('5ee49c3115a4e75254bb732e');
    expect(model.create).toHaveBeenCalledWith({
      ...toCreated,
      createdBy: TEST_USER_ID,
    });
    expect(model.create).toHaveBeenCalledTimes(1);
  });

  describe('update', () => {
    it('perform update if post exists', async () => {
      const toUpdated = {
        _id: '5ee49c3115a4e75254bb732e',
        title: 'test title',
        content: 'test content',
      };

      vi.spyOn(model, 'findOneAndUpdate').mockReturnValue({
        exec: vi.fn().mockResolvedValue(toUpdated) as any,
      } as any);

      const data = await lastValueFrom(
        service.update('5ee49c3115a4e75254bb732e', toUpdated),
      );
      expect(data).toBeTruthy();
      expect(model.findOneAndUpdate).toHaveBeenCalled();
    });

    it('throw an NotFoundException if post not exists', async () => {
      const toUpdated = {
        _id: '5ee49c3115a4e75254bb732e',
        title: 'test title',
        content: 'test content',
      };
      vi.spyOn(model, 'findOneAndUpdate').mockReturnValue({
        exec: vi.fn().mockResolvedValue(null) as any,
      } as any);

      try {
        await lastValueFrom(
          service.update('5ee49c3115a4e75254bb732e', toUpdated),
        );
      } catch (error) {
        expect(error).toBeDefined();
        expect(model.findOneAndUpdate).toHaveBeenCalledTimes(1);
      }
    });
  });

  describe('delete', () => {
    it('perform delete if post exists', async () => {
      const toDeleted = {
        _id: '5ee49c3115a4e75254bb732e',
        title: 'test title',
        content: 'test content',
      };
      vi.spyOn(model, 'findOneAndDelete').mockReturnValue({
        exec: vi.fn().mockResolvedValueOnce(toDeleted),
      } as any);

      const data = await lastValueFrom(service.deleteById('anystring'));
      expect(data).toBeTruthy();
      expect(model.findOneAndDelete).toHaveBeenCalled();
    });

    it('throw an NotFoundException if post not exists', async () => {
      vi.spyOn(model, 'findOneAndDelete').mockReturnValue({
        exec: vi.fn().mockResolvedValue(null),
      } as any);
      try {
        await lastValueFrom(service.deleteById('anystring'));
      } catch (error) {
        expect(error).toBeDefined();
        expect(model.findOneAndDelete).toHaveBeenCalledTimes(1);
      }
    });
  });

  it('should delete all post', async () => {
    vi.spyOn(model, 'deleteMany').mockReturnValue({
      exec: vi.fn().mockResolvedValueOnce({
        deletedCount: 1,
      }),
    } as any);

    const data = await lastValueFrom(service.deleteAll());
    expect(data).toBeTruthy();
  });

  it('should create comment ', async () => {
    const comment = { content: 'test' };
    const TEST_ID = '605c39f4bcf86cd799439011';
    const TEST_OBJ_ID = new Types.ObjectId(TEST_ID);
    const mockedCreateResult = {
      ...comment,
      post: TEST_OBJ_ID,
    } as any;
    vi.spyOn(commentModel, 'create').mockImplementation((any) =>
      Promise.resolve(mockedCreateResult),
    );

    const result = await lastValueFrom(
      service.createCommentFor(TEST_ID, comment),
    );
    expect(result.content).toEqual('test');
    expect(commentModel.create).toHaveBeenCalledWith({
      ...comment,
      post: TEST_OBJ_ID,
      createdBy: TEST_USER_ID,
    });
  });

  it('should get comments of post ', async () => {
    const TEST_ID = '605c39f4bcf86cd799439011';
    const TEST_OBJ_ID = new Types.ObjectId(TEST_ID);
    vi.spyOn(commentModel, 'find').mockImplementation(() => {
      return {
        select: vi.fn().mockReturnValue({
          exec: vi.fn().mockResolvedValue([
            {
              _id: '605c3a2ebcf86cd799439012',
              content: 'content',
              post: TEST_OBJ_ID,
            },
          ] as any),
        }),
      } as any;
    });

    const result = await lastValueFrom(service.commentsOf(TEST_ID));
    expect(result.length).toBe(1);
    expect(result[0].content).toEqual('content');
    expect(commentModel.find).toHaveBeenCalledWith({ post: TEST_OBJ_ID });
  });
});

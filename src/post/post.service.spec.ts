import { REQUEST } from '@nestjs/core';
import { Test, TestingModule } from '@nestjs/testing';
import { FilterQuery, Model } from 'mongoose';
import { lastValueFrom } from 'rxjs';
import { Comment } from '../database/comment.model';
import { COMMENT_MODEL, POST_MODEL } from '../database/database.constants';
import { Post } from '../database/post.model';
import { PostService } from './post.service';

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
    jest.spyOn(model, 'find').mockReturnValue({
      skip: jest.fn().mockReturnValue({
        limit: jest.fn().mockReturnValue({
          exec: jest.fn().mockResolvedValueOnce(posts) as any,
        }),
      }),
    } as any);

    const data = await lastValueFrom(service.findAll());
    expect(data.length).toBe(3);
    expect(model.find).toHaveBeenCalled();

    jest
      .spyOn(model, 'find')
      .mockImplementation(
        (
          conditions: FilterQuery<Post>,
          callback?: (err: any, res: Post[]) => void,
        ) => {
          return {
            skip: jest.fn().mockReturnValue({
              limit: jest.fn().mockReturnValue({
                exec: jest.fn().mockResolvedValueOnce([posts[0]]),
              }),
            }),
          } as any;
        },
      );

    const result = await lastValueFrom(service.findAll('Generate', 0, 10));
    expect(result.length).toBe(1);
    expect(model.find).lastCalledWith({
      title: { $regex: '.*' + 'Generate' + '.*' },
    });
  });

  describe('findByid', () => {
    it('if exists return one post', (done) => {
      const found = {
        _id: '5ee49c3115a4e75254bb732e',
        title: 'Generate a NestJS project',
        content: 'content',
      };

      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(found) as any,
      } as any);

      service.findById('1').subscribe({
        next: (data) => {
          expect(data._id).toBe('5ee49c3115a4e75254bb732e');
          expect(data.title).toEqual('Generate a NestJS project');
        },
        error: (error) => console.log(error),
        complete: done(),
      });
    });

    it('if not found throw an NotFoundException', (done) => {
      jest.spyOn(model, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null) as any,
      } as any);

      service.findById('1').subscribe({
        next: (data) => {
          console.log(data);
        },
        error: (error) => {
          expect(error).toBeDefined();
        },
        complete: done(),
      });
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
    } as Post;

    jest
      .spyOn(model, 'create')
      .mockImplementation(() => Promise.resolve(toReturned));

    const data = await lastValueFrom(service.save(toCreated));
    expect(data._id).toBe('5ee49c3115a4e75254bb732e');
    expect(model.create).toBeCalledWith({
      ...toCreated,
      createdBy: {
        _id: 'dummyId',
      },
    });
    expect(model.create).toBeCalledTimes(1);
  });

  describe('update', () => {
    it('perform update if post exists', (done) => {
      const toUpdated = {
        _id: '5ee49c3115a4e75254bb732e',
        title: 'test title',
        content: 'test content',
      };

      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(toUpdated) as any,
      } as any);

      service.update('5ee49c3115a4e75254bb732e', toUpdated).subscribe({
        next: (data) => {
          expect(data).toBeTruthy();
          expect(model.findOneAndUpdate).toBeCalled();
        },
        error: (error) => console.log(error),
        complete: done(),
      });
    });

    it('throw an NotFoundException if post not exists', (done) => {
      const toUpdated = {
        _id: '5ee49c3115a4e75254bb732e',
        title: 'test title',
        content: 'test content',
      };
      jest.spyOn(model, 'findOneAndUpdate').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null) as any,
      } as any);

      service.update('5ee49c3115a4e75254bb732e', toUpdated).subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          expect(model.findOneAndUpdate).toHaveBeenCalledTimes(1);
        },
        complete: done(),
      });
    });
  });

  describe('delete', () => {
    it('perform delete if post exists', (done) => {
      const toDeleted = {
        _id: '5ee49c3115a4e75254bb732e',
        title: 'test title',
        content: 'test content',
      };
      jest.spyOn(model, 'findOneAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(toDeleted),
      } as any);

      service.deleteById('anystring').subscribe({
        next: (data) => {
          expect(data).toBeTruthy();
          expect(model.findOneAndDelete).toBeCalled();
        },
        error: (error) => console.log(error),
        complete: done(),
      });
    });

    it('throw an NotFoundException if post not exists', (done) => {
      jest.spyOn(model, 'findOneAndDelete').mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      } as any);
      service.deleteById('anystring').subscribe({
        error: (error) => {
          expect(error).toBeDefined();
          expect(model.findOneAndDelete).toBeCalledTimes(1);
        },
        complete: done(),
      });
    });
  });

  it('should delete all post', (done) => {
    jest.spyOn(model, 'deleteMany').mockReturnValue({
      exec: jest.fn().mockResolvedValueOnce({
        deletedCount: 1,
      }),
    } as any);

    service.deleteAll().subscribe({
      next: (data) => expect(data).toBeTruthy,
      error: (error) => console.log(error),
      complete: done(),
    });
  });

  it('should create comment ', async () => {
    const comment = { content: 'test' };
    jest.spyOn(commentModel, 'create').mockImplementation(() =>
      Promise.resolve({
        ...comment,
        post: { _id: 'test' },
      } as any),
    );

    const result = await lastValueFrom(
      service.createCommentFor('test', comment),
    );
    expect(result.content).toEqual('test');
    expect(commentModel.create).toBeCalledWith({
      ...comment,
      post: { _id: 'test' },
      createdBy: { _id: 'dummyId' },
    });
  });

  it('should get comments of post ', async () => {
    jest
      .spyOn(commentModel, 'find')
      .mockImplementation(
        (
          conditions: FilterQuery<Comment>,
          callback?: (err: any, res: Comment[]) => void,
        ) => {
          return {
            select: jest.fn().mockReturnValue({
              exec: jest.fn().mockResolvedValue([
                {
                  _id: 'test',
                  content: 'content',
                  post: { _id: '_test_id' },
                },
              ] as any),
            }),
          } as any;
        },
      );

    const result = await lastValueFrom(service.commentsOf('test'));
    expect(result.length).toBe(1);
    expect(result[0].content).toEqual('content');
    expect(commentModel.find).toBeCalledWith({ post: { _id: 'test' } });
  });
});

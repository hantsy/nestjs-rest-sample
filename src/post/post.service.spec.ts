import { Test, TestingModule } from '@nestjs/testing';
import { PostService } from './post.service';
import { getModelToken } from '@nestjs/mongoose';
import { Post } from './post.model';
import { Model } from 'mongoose';

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

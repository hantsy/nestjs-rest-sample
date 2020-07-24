import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { USER_MODEL } from '../database/database.constants';
import { User } from '../database/user.model';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let model: Model<User>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_MODEL,
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    model = module.get<Model<User>>(USER_MODEL);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('findByUsername should return user', async () => {
    jest
      .spyOn(model, 'findOne')
      .mockImplementation((conditions: any, projection: any, options: any) => {
        return {
          exec: jest.fn().mockResolvedValue({
            username: 'hantsy',
            email: 'hantsy@example.com',
          } as User),
        } as any;
      });

    const foundUser = await service.findByUsername('hantsy').toPromise();
    expect(foundUser).toEqual({
      username: 'hantsy',
      email: 'hantsy@example.com',
    });
    expect(model.findOne).lastCalledWith({ username: 'hantsy' });
    expect(model.findOne).toBeCalledTimes(1);
  });

  it('findById', async () => {
    jest
      .spyOn(model, 'findOne')
      .mockImplementation((conditions: any, projection: any, options: any) => {
        return {
          exec: jest.fn().mockResolvedValue({
            username: 'hantsy',
            email: 'hantsy@example.com',
          } as User),
        } as any;
      });

    const foundUser = await service.findById('hantsy').toPromise();
    expect(foundUser).toEqual({
      username: 'hantsy',
      email: 'hantsy@example.com',
    });
    expect(model.findOne).lastCalledWith({ _id: 'hantsy' });
    expect(model.findOne).toBeCalledTimes(1);
  });

  it('findById with a null result', async () => {
    jest
      .spyOn(model, 'findOne')
      .mockImplementation((conditions: any, projection: any, options: any) => {
        return {
          exec: jest.fn().mockResolvedValue(null) as any,
        } as any;
      });

    try {
      const foundUser = await service.findById('hantsy').toPromise();
    } catch (e) {
      expect(e).toBeDefined();
    }
  });


  it('findById withPosts=true', async () => {
    jest
      .spyOn(model, 'findOne')
      .mockImplementation((conditions: any, projection: any, options: any) => {
        return {
          populate: jest.fn().mockReturnThis(),
          exec: jest.fn().mockResolvedValue({
            username: 'hantsy',
            email: 'hantsy@example.com',
          } as User),
        } as any;
      });

    const foundUser = await service.findById('hantsy', true).toPromise();
    expect(foundUser).toEqual({
      username: 'hantsy',
      email: 'hantsy@example.com',
    });
    expect(model.findOne).lastCalledWith({ _id: 'hantsy' });
    expect(model.findOne).toBeCalledTimes(1);
  });
});

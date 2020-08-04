import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { USER_MODEL } from '../database/database.constants';
import { User } from '../database/user.model';
import { UserService } from './user.service';
import { Controller } from '@nestjs/common';
import { RoleType } from '../auth/enum/role-type.enum';

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
            exists: jest.fn(),
            create: jest.fn()
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

  it('save ', async () => {
    const sampleData = {
      username: 'hantsy',
      email: 'hantsy@example.com',
      fristName: 'hantsy',
      lastName: 'bai',
      password: 'mysecret'
    }

    const saveSpy = jest.spyOn(model, 'create').mockResolvedValue({
      _id:'123',
      ...sampleData
    } as any);

    const result = await service.save(sampleData).toPromise();
    expect(saveSpy).toBeCalledWith({ ...sampleData, roles: [RoleType.USER] });
    expect(result._id).toBeDefined();
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

  describe('findById', () => {
    it('return one result', async () => {
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

    it('return a null result', async () => {
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


    it('parameter withPosts=true', async () => {
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

  describe('existsByUsername', () => {

    it('should return true if exists ', async () => {
      const existsSpy = jest.spyOn(model, 'exists').mockResolvedValue(true);
      const result = await service.existsByUsername('hantsy').toPromise();

      expect(existsSpy).toBeCalledWith({ username: 'hantsy' });
      expect(existsSpy).toBeCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('should return false if not exists ', async () => {
      const existsSpy = jest.spyOn(model, 'exists').mockResolvedValue(false);
      const result = await service.existsByUsername('hantsy').toPromise();

      expect(existsSpy).toBeCalledWith({ username: 'hantsy' });
      expect(existsSpy).toBeCalledTimes(1);
      expect(result).toBeFalsy();
    });
  });

  describe('existsByEmail', () => {

    it('should return true if exists ', async () => {
      const existsSpy = jest.spyOn(model, 'exists').mockResolvedValue(true);
      const result = await service.existsByEmail('hantsy@example.com').toPromise();

      expect(existsSpy).toBeCalledWith({ email: 'hantsy@example.com' });
      expect(existsSpy).toBeCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('should return false if not exists ', async () => {
      const existsSpy = jest.spyOn(model, 'exists').mockResolvedValue(false);
      const result = await service.existsByEmail('hantsy@example.com').toPromise();

      expect(existsSpy).toBeCalledWith({ email: 'hantsy@example.com' });
      expect(existsSpy).toBeCalledTimes(1);
      expect(result).toBeFalsy();
    });
  });
});

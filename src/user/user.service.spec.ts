import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom, of } from 'rxjs';

import { USER_MODEL } from '../database/database.constants';
import { User, UserModel } from '../database/user.model';
import { SendgridService } from '../sendgrid/sendgrid.service';
import { RoleType } from '../shared/enum/role-type.enum';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let model: UserModel;
  let sendgrid: SendgridService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: USER_MODEL,
          useValue: {
            findOne: vi.fn(),
            exists: vi.fn(),
            create: vi.fn(),
          },
        },
        {
          provide: SendgridService,
          useValue: {
            send: vi.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    sendgrid = module.get<SendgridService>(SendgridService);
    model = module.get<UserModel>(USER_MODEL);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('save ', async () => {
    const sampleData = {
      username: 'hantsy',
      email: 'hantsy@example.com',
      firstName: 'hantsy',
      lastName: 'bai',
      password: 'mysecret',
    };

    const msg = {
      from: 'service@example.com', // Use the email address or domain you verified above
      subject: 'Welcome to Nestjs Sample',
      templateId: 'welcome',
      personalizations: [
        {
          to: 'hantsy@example.com',
          dynamicTemplateData: { name: 'hantsy bai' },
        },
      ],
    };

    const saveSpy = vi.spyOn(model, 'create').mockImplementation(() =>
      Promise.resolve({
        _id: '123',
        ...sampleData,
      } as any),
    );

    vi.spyOn(sendgrid, 'send').mockImplementation(() => {
      return of([{} as any, {}] as [any, {}]);
    });

    const result = await lastValueFrom(service.register(sampleData));
    expect(saveSpy).toHaveBeenCalledWith({
      ...sampleData,
      roles: [RoleType.USER],
    });
    expect(result._id).toBeDefined();
    //expect(sendSpy).toBeCalledWith(msg);
    //expect(pipeSpy).toBeCalled();
  });

  it('findByUsername should return user', async () => {
    vi.spyOn(model, 'findOne').mockImplementation(
      (filter?: any, projection?: any, options?: any) =>
        ({
          exec: vi.fn().mockResolvedValue({
            username: 'hantsy',
            email: 'hantsy@example.com',
          } as User),
        }) as any,
    );

    const foundUser = await lastValueFrom(service.findByUsername('hantsy'));
    expect(foundUser).toEqual({
      username: 'hantsy',
      email: 'hantsy@example.com',
    });
    expect(model.findOne).toHaveBeenLastCalledWith({ username: 'hantsy' });
    expect(model.findOne).toHaveBeenCalledTimes(1);
  });

  it('findByUsername should return null if not found', async () => {
    vi.spyOn(model, 'findOne').mockImplementation(
      (filter?: any, projection?: any, options?: any) =>
        ({
          exec: vi.fn().mockResolvedValue(null) as any,
        }) as any,
    );
    try {
      const foundUser = await lastValueFrom(service.findByUsername('hantsy'));
    } catch (e) {
      expect(e).toBeDefined();
    }
  });

  describe('findById', () => {
    it('return one result', async () => {
      vi.spyOn(model, 'findOne').mockImplementation(
        (filter?: any, projection?: any, options?: any) =>
          ({
            exec: vi.fn().mockResolvedValue({
              username: 'hantsy',
              email: 'hantsy@example.com',
            } as User),
          }) as any,
      );

      const foundUser = await lastValueFrom(service.findById('hantsy'));
      expect(foundUser).toEqual({
        username: 'hantsy',
        email: 'hantsy@example.com',
      });
      expect(model.findOne).toHaveBeenLastCalledWith({ _id: 'hantsy' });
      expect(model.findOne).toHaveBeenCalledTimes(1);
    });

    it('return a null result', async () => {
      vi.spyOn(model, 'findOne').mockImplementation(
        (filter?: any, projection?: any, options?: any) =>
          ({
            exec: vi.fn().mockResolvedValue(null) as any,
          }) as any,
      );

      try {
        const foundUser = await lastValueFrom(service.findById('hantsy'));
      } catch (e) {
        expect(e).toBeDefined();
      }
    });

    it('parameter withPosts=true', async () => {
      vi.spyOn(model, 'findOne').mockImplementation(
        (filter?: any, projection?: any, options?: any) =>
          ({
            populate: vi.fn().mockReturnThis(),
            exec: vi.fn().mockResolvedValue({
              username: 'hantsy',
              email: 'hantsy@example.com',
            } as User),
          }) as any,
      );

      const foundUser = await lastValueFrom(service.findById('hantsy', true));
      expect(foundUser).toEqual({
        username: 'hantsy',
        email: 'hantsy@example.com',
      });
      expect(model.findOne).toHaveBeenLastCalledWith({ _id: 'hantsy' });
      expect(model.findOne).toHaveBeenCalledTimes(1);
    });
  });

  describe('existsByUsername', () => {
    it('should return true if exists ', async () => {
      const existsSpy = vi
        .spyOn(model, 'exists')
        .mockImplementation((filter: any) => {
          return {
            exec: vi.fn().mockResolvedValue({
              _id: 'test',
            } as any),
          } as any;
        });
      const result = await lastValueFrom(service.existsByUsername('hantsy'));

      expect(existsSpy).toHaveBeenCalledWith({ username: 'hantsy' });
      expect(existsSpy).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('should return false if not exists ', async () => {
      const existsSpy = vi
        .spyOn(model, 'exists')
        .mockImplementation((filter: any) => {
          return {
            exec: vi.fn().mockResolvedValue(null),
          } as any;
        });
      const result = await lastValueFrom(service.existsByUsername('hantsy'));

      expect(existsSpy).toHaveBeenCalledWith({ username: 'hantsy' });
      expect(existsSpy).toHaveBeenCalledTimes(1);
      expect(result).toBeFalsy();
    });
  });

  describe('existsByEmail', () => {
    it('should return true if exists ', async () => {
      const existsSpy = vi
        .spyOn(model, 'exists')
        .mockImplementation((filter: any) => {
          return {
            exec: vi.fn().mockResolvedValue({
              _id: 'test',
            } as any),
          } as any;
        });
      const result = await lastValueFrom(
        service.existsByEmail('hantsy@example.com'),
      );

      expect(existsSpy).toHaveBeenCalledWith({ email: 'hantsy@example.com' });
      expect(existsSpy).toHaveBeenCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('should return false if not exists ', async () => {
      const existsSpy = vi
        .spyOn(model, 'exists')
        .mockImplementation((filter: any) => {
          return {
            exec: vi.fn().mockResolvedValue(null),
          } as any;
        });
      const result = await lastValueFrom(
        service.existsByEmail('hantsy@example.com'),
      );

      expect(existsSpy).toHaveBeenCalledWith({ email: 'hantsy@example.com' });
      expect(existsSpy).toHaveBeenCalledTimes(1);
      expect(result).toBeFalsy();
    });
  });
});

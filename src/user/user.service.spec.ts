import { Test, TestingModule } from '@nestjs/testing';
import { Model } from 'mongoose';
import { of } from 'rxjs';
import { RoleType } from '../shared/enum/role-type.enum';
import { USER_MODEL } from '../database/database.constants';
import { User } from '../database/user.model';
import { SendgridService } from '../sendgrid/sendgrid.service';
import { UserService } from './user.service';

describe('UserService', () => {
  let service: UserService;
  let model: Model<User>;
  let sendgrid: SendgridService;

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
        {
          provide: SendgridService,
          useValue: {
            send: jest.fn()
          }
        }
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    sendgrid = module.get<SendgridService>(SendgridService);
    model = module.get<Model<User>>(USER_MODEL);
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
      password: 'mysecret'
    }

    const msg = {
      from: 'service@example.com', // Use the email address or domain you verified above
      subject: 'Welcome to Nestjs Sample',
      templateId: "welcome",
      personalizations: [
        {
          to: 'hantsy@example.com',
          dynamicTemplateData: { name: 'hantsy bai' },
        }
      ]

    };

    const saveSpy = jest.spyOn(model, 'create').mockImplementation(() => Promise.resolve({
      _id: '123',
      ...sampleData
    } as any));

    const pipeMock = {
      pipe: jest.fn()
    }

    const pipeSpy = jest.spyOn(pipeMock, 'pipe');

    const sendSpy = jest.spyOn(sendgrid, 'send')
      .mockImplementation((data: any) => { return of(pipeMock) });

    const result = await service.register(sampleData).toPromise();
    expect(saveSpy).toBeCalledWith({ ...sampleData, roles: [RoleType.USER] });
    expect(result._id).toBeDefined();
    //expect(sendSpy).toBeCalledWith(msg);
    //expect(pipeSpy).toBeCalled();
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
      const existsSpy = jest.spyOn(model, 'exists').mockImplementation(() => Promise.resolve(true));
      const result = await service.existsByUsername('hantsy').toPromise();

      expect(existsSpy).toBeCalledWith({ username: 'hantsy' });
      expect(existsSpy).toBeCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('should return false if not exists ', async () => {
      const existsSpy = jest.spyOn(model, 'exists').mockImplementation(() => Promise.resolve(false));
      const result = await service.existsByUsername('hantsy').toPromise();

      expect(existsSpy).toBeCalledWith({ username: 'hantsy' });
      expect(existsSpy).toBeCalledTimes(1);
      expect(result).toBeFalsy();
    });
  });

  describe('existsByEmail', () => {

    it('should return true if exists ', async () => {
      const existsSpy = jest.spyOn(model, 'exists').mockImplementation(() => Promise.resolve(true));
      const result = await service.existsByEmail('hantsy@example.com').toPromise();

      expect(existsSpy).toBeCalledWith({ email: 'hantsy@example.com' });
      expect(existsSpy).toBeCalledTimes(1);
      expect(result).toBeTruthy();
    });

    it('should return false if not exists ', async () => {
      const existsSpy = jest.spyOn(model, 'exists').mockImplementation(() => Promise.resolve(false));
      const result = await service.existsByEmail('hantsy@example.com').toPromise();

      expect(existsSpy).toBeCalledWith({ email: 'hantsy@example.com' });
      expect(existsSpy).toBeCalledTimes(1);
      expect(result).toBeFalsy();
    });
  });
});

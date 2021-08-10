import { Test, TestingModule } from '@nestjs/testing';
import { RegisterController } from './register.controller';
import { UserService } from './user.service';
import { of, lastValueFrom } from 'rxjs';
import { User } from 'database/user.model';
import { RegisterDto } from './register.dto';

describe('Register Controller', () => {
  let controller: RegisterController;
  let service: UserService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegisterController],
      providers: [
        {
          provide: UserService,
          useValue: {
            register: jest.fn(),
            existsByUsername: jest.fn(),
            existsByEmail: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<RegisterController>(RegisterController);
    service = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('register', () => {
    it('should throw ConflictException when username is existed ', async () => {
      const existsByUsernameSpy = jest
        .spyOn(service, 'existsByUsername')
        .mockReturnValue(of(true));
      const existsByEmailSpy = jest
        .spyOn(service, 'existsByEmail')
        .mockReturnValue(of(true));
      const saveSpy = jest
        .spyOn(service, 'register')
        .mockReturnValue(of({} as User));

      const responseMock = {
        location: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as any;
      try {
        await lastValueFrom(
          controller.register(
            { username: 'hantsy' } as RegisterDto,
            responseMock,
          ),
        );
      } catch (e) {
        expect(e).toBeDefined();
        expect(existsByUsernameSpy).toBeCalledWith('hantsy');
        expect(existsByEmailSpy).toBeCalledTimes(0);
        expect(saveSpy).toBeCalledTimes(0);
      }
    });

    it('should throw ConflictException when email is existed ', async () => {
      const existsByUsernameSpy = jest
        .spyOn(service, 'existsByUsername')
        .mockReturnValue(of(false));
      const existsByEmailSpy = jest
        .spyOn(service, 'existsByEmail')
        .mockReturnValue(of(true));
      const saveSpy = jest
        .spyOn(service, 'register')
        .mockReturnValue(of({} as User));

      const responseMock = {
        location: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as any;
      try {
        await lastValueFrom(
          controller.register(
            { username: 'hantsy', email: 'hantsy@example.com' } as RegisterDto,
            responseMock,
          ),
        );
      } catch (e) {
        expect(e).toBeDefined();
        expect(existsByUsernameSpy).toBeCalledWith('hantsy');
        expect(existsByEmailSpy).toBeCalledWith('hantsy@example.com');
        expect(saveSpy).toBeCalledTimes(0);
      }
    });

    it('should save when username and email are available ', async () => {
      const existsByUsernameSpy = jest
        .spyOn(service, 'existsByUsername')
        .mockReturnValue(of(false));
      const existsByEmailSpy = jest
        .spyOn(service, 'existsByEmail')
        .mockReturnValue(of(false));
      const saveSpy = jest
        .spyOn(service, 'register')
        .mockReturnValue(of({ _id: '123' } as User));

      const responseMock = {
        location: jest.fn().mockReturnThis(),
        status: jest.fn().mockReturnThis(),
        send: jest.fn().mockReturnThis(),
      } as any;

      const locationSpy = jest.spyOn(responseMock, 'location');
      const statusSpy = jest.spyOn(responseMock, 'status');
      const sendSpy = jest.spyOn(responseMock, 'send');

      await lastValueFrom(
        controller.register(
          { username: 'hantsy', email: 'hantsy@example.com' } as RegisterDto,
          responseMock,
        ),
      );

      expect(existsByUsernameSpy).toBeCalledWith('hantsy');
      expect(existsByEmailSpy).toBeCalledWith('hantsy@example.com');
      expect(saveSpy).toBeCalledTimes(1);
      expect(locationSpy).toBeCalled();
      expect(statusSpy).toBeCalled();
      expect(sendSpy).toBeCalled();
    });
  });
});

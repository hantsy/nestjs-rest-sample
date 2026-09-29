import { Test, TestingModule } from '@nestjs/testing';
import { RegisterController } from './register.controller';
import { UserService } from './user.service';
import { of } from 'rxjs';
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
            register: vi.fn(),
            existsByUsername: vi.fn(),
            existsByEmail: vi.fn(),
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
      const existsByUsernameSpy = vi
        .spyOn(service, 'existsByUsername')
        .mockReturnValue(of(true));
      const existsByEmailSpy = vi
        .spyOn(service, 'existsByEmail')
        .mockReturnValue(of(true));
      const saveSpy = vi
        .spyOn(service, 'register')
        .mockReturnValue(of({} as User));

      const responseMock = {
        location: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as any;
      try {
        await controller.register(
          { username: 'hantsy' } as RegisterDto,
          responseMock,
        );
      } catch (e) {
        expect(e).toBeDefined();
        expect(existsByUsernameSpy).toHaveBeenCalledWith('hantsy');
        expect(existsByEmailSpy).toHaveBeenCalledTimes(0);
        expect(saveSpy).toHaveBeenCalledTimes(0);
      }
    });

    it('should throw ConflictException when email is existed ', async () => {
      const existsByUsernameSpy = vi
        .spyOn(service, 'existsByUsername')
        .mockReturnValue(of(false));
      const existsByEmailSpy = vi
        .spyOn(service, 'existsByEmail')
        .mockReturnValue(of(true));
      const saveSpy = vi
        .spyOn(service, 'register')
        .mockReturnValue(of({} as User));

      const responseMock = {
        location: vi.fn().mockReturnThis(),
        json: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as any;
      try {
        await controller.register(
          { username: 'hantsy', email: 'hantsy@example.com' } as RegisterDto,
          responseMock,
        );
      } catch (e) {
        expect(e).toBeDefined();
        expect(existsByUsernameSpy).toHaveBeenCalledWith('hantsy');
        expect(existsByEmailSpy).toHaveBeenCalledWith('hantsy@example.com');
        expect(saveSpy).toHaveBeenCalledTimes(0);
      }
    });

    it('should save when username and email are available ', async () => {
      const existsByUsernameSpy = vi
        .spyOn(service, 'existsByUsername')
        .mockReturnValue(of(false));
      const existsByEmailSpy = vi
        .spyOn(service, 'existsByEmail')
        .mockReturnValue(of(false));
      const saveSpy = vi
        .spyOn(service, 'register')
        .mockReturnValue(of({ _id: '123' } as unknown as User));

      const responseMock = {
        location: vi.fn().mockReturnThis(),
        status: vi.fn().mockReturnThis(),
        send: vi.fn().mockReturnThis(),
      } as any;

      const locationSpy = vi.spyOn(responseMock, 'location');
      const statusSpy = vi.spyOn(responseMock, 'status');
      const sendSpy = vi.spyOn(responseMock, 'send');

      await controller.register(
        { username: 'hantsy', email: 'hantsy@example.com' } as RegisterDto,
        responseMock,
      );

      expect(existsByUsernameSpy).toHaveBeenCalledWith('hantsy');
      expect(existsByEmailSpy).toHaveBeenCalledWith('hantsy@example.com');
      expect(saveSpy).toHaveBeenCalledTimes(1);
      expect(locationSpy).toHaveBeenCalled();
      expect(statusSpy).toHaveBeenCalled();
      expect(sendSpy).toHaveBeenCalled();
    });
  });
});

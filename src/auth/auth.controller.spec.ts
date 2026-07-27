import { Test, TestingModule } from '@nestjs/testing';
import { lastValueFrom, of } from 'rxjs';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: AuthService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            constructor: jest.fn(),
            login: jest.fn(),
            refreshToken: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = app.get<AuthController>(AuthController);
    authService = app.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return tokens', async () => {
      jest
        .spyOn(authService, 'login')
        .mockImplementation((user: any) =>
          of({ access_token: 'jwttoken', refresh_token: 'refreshtoken' }),
        );

      const token = await lastValueFrom(
        controller.login({ user: { id: '1', username: 'test' } } as any),
      );
      expect(token.access_token).toBe('jwttoken');
      expect(token.refresh_token).toBe('refreshtoken');
      expect(authService.login).toHaveBeenCalled();
    });
  });

  describe('refresh', () => {
    it('should return new tokens', async () => {
      jest
        .spyOn(authService, 'refreshToken')
        .mockImplementation((token: string) =>
          of({ access_token: 'newtoken', refresh_token: 'newrefresh' }),
        );

      const result = await lastValueFrom(
        controller.refresh({ refresh_token: 'oldrefreshtoken' }),
      );
      expect(result.access_token).toBe('newtoken');
      expect(result.refresh_token).toBe('newrefresh');
      expect(authService.refreshToken).toHaveBeenCalledWith('oldrefreshtoken');
    });
  });
});

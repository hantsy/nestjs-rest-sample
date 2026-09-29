import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { lastValueFrom, of, throwError } from 'rxjs';
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
            constructor: vi.fn(),
            login: vi.fn(),
            refreshToken: vi.fn(),
          },
        },
      ],
    }).compile();

    controller = app.get<AuthController>(AuthController);
    authService = app.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return tokens', async () => {
      vi.spyOn(authService, 'login').mockImplementation((user: any) =>
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
      vi.spyOn(authService, 'refreshToken').mockImplementation(
        (token: string) =>
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

  describe('refresh (error handling)', () => {
    it('should propagate UnauthorizedException from the service', async () => {
      vi.spyOn(authService, 'refreshToken').mockReturnValue(
        throwError(
          () => new UnauthorizedException('Invalid or expired refresh token'),
        ),
      );

      await expect(
        lastValueFrom(controller.refresh({ refresh_token: 'bad' })),
      ).rejects.toThrow(UnauthorizedException);
      expect(authService.refreshToken).toHaveBeenCalledWith('bad');
    });
  });

  describe('login (delegation)', () => {
    it('should pass the authenticated user to the service', async () => {
      const user = {
        id: '1',
        username: 'test',
        email: 'test@example.com',
        roles: [],
      };
      vi.spyOn(authService, 'login').mockReturnValue(
        of({ access_token: 'a', refresh_token: 'r' }),
      );

      await lastValueFrom(controller.login({ user } as any));
      expect(authService.login).toHaveBeenCalledWith(user);
    });
  });
});

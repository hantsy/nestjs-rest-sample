import { UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { of, throwError } from 'rxjs';
import { lastValueFrom } from 'rxjs';
import jwtConfig from '../config/jwt.config';
import { User, UserMethods } from '../database/user.model';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';
import { RoleType } from '../shared/enum/role-type.enum';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: UserService,
          useValue: {
            constructor: vi.fn(),
            findByUsername: vi.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            constructor: vi.fn(),
            signAsync: vi.fn(),
            verifyAsync: vi.fn(),
          },
        },
        {
          provide: jwtConfig.KEY,
          useValue: {
            secretKey: 'test-secret',
            expiresIn: '3600s',
            refreshSecretKey: 'test-refresh-secret',
            refreshExpiresIn: '7d',
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    jwtService = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateUser', () => {
    it('if user is found', async () => {
      vi.spyOn(userService, 'findByUsername').mockImplementation(
        (username: string) => {
          return of({
            _id: 'userid' as any,
            username,
            password: 'password',
            email: 'hantsy@example.com',
            roles: [RoleType.USER],
            comparePassword: (password: string) => of(true),
          } as User & UserMethods);
        },
      );

      const data = await lastValueFrom(
        service.validateUser('test', 'password'),
      );
      expect(data.username).toBe('test');
      expect(data.email).toBe('hantsy@example.com');
      expect(data.roles).toEqual([RoleType.USER]);
      expect(userService.findByUsername).toHaveBeenCalledTimes(1);
      expect(userService.findByUsername).toHaveBeenCalledWith('test');
    });

    it('if user is found but pass is mismatched', async () => {
      vi.spyOn(userService, 'findByUsername').mockImplementation(
        (username: string) => {
          return of({
            _id: 'userid' as any,
            username,
            password: 'password',
            email: 'hantsy@example.com',
            roles: [RoleType.USER],
            comparePassword: (password: string) => of(false),
          } as User & UserMethods);
        },
      );

      await expect(
        lastValueFrom(service.validateUser('test', 'password001')),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('if user is not found', async () => {
      vi.spyOn(userService, 'findByUsername').mockImplementation(
        (username: string) => {
          return of(null as unknown as User & UserMethods);
        },
      );

      try {
        await lastValueFrom(service.validateUser('test', 'password001'));
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('login', () => {
    it('should return access_token and refresh_token', async () => {
      vi.spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('access-token-value')
        .mockResolvedValueOnce('refresh-token-value');

      const data = await lastValueFrom(
        service.login({
          username: 'test',
          id: '_id',
          email: 'hantsy@example.com',
          roles: [RoleType.USER],
        }),
      );
      expect(data.access_token).toBe('access-token-value');
      expect(data.refresh_token).toBe('refresh-token-value');
      expect(jwtService.signAsync).toHaveBeenCalledTimes(2);
    });
  });

  describe('refreshToken', () => {
    it('should return new tokens when refresh token is valid', async () => {
      vi.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        upn: 'test',
        sub: '_id',
        email: 'hantsy@example.com',
        roles: [RoleType.USER],
      });
      vi.spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('new-access-token')
        .mockResolvedValueOnce('new-refresh-token');

      const data = await lastValueFrom(
        service.refreshToken('valid-refresh-token'),
      );
      expect(data.access_token).toBe('new-access-token');
      expect(data.refresh_token).toBe('new-refresh-token');
      expect(jwtService.verifyAsync).toHaveBeenCalledWith(
        'valid-refresh-token',
        { secret: 'test-refresh-secret' },
      );
    });

    it('should throw if refresh token is invalid', async () => {
      vi.spyOn(jwtService, 'verifyAsync').mockRejectedValue(
        new Error('invalid token'),
      );

      try {
        await lastValueFrom(service.refreshToken('bad-token'));
      } catch (error) {
        expect(error).toBeDefined();
      }
    });
  });

  describe('validateUser (additional cases)', () => {
    it('should error with UnauthorizedException when lookup completes without a user', async () => {
      vi.spyOn(userService, 'findByUsername').mockReturnValue(
        of(null as unknown as User & UserMethods),
      );

      await expect(
        lastValueFrom(service.validateUser('test', 'password')),
      ).rejects.toThrow(UnauthorizedException);
      await expect(
        lastValueFrom(service.validateUser('test', 'password')),
      ).rejects.toThrow('username or password is not matched');
    });

    it('should propagate lookup errors unchanged', async () => {
      const lookupError = new Error('db down');
      vi.spyOn(userService, 'findByUsername').mockReturnValue(
        throwError(() => lookupError),
      );

      await expect(
        lastValueFrom(service.validateUser('test', 'password')),
      ).rejects.toBe(lookupError);
    });

    it('should propagate password comparison errors unchanged', async () => {
      const compareError = new Error('bcrypt failure');
      vi.spyOn(userService, 'findByUsername').mockReturnValue(
        of({
          _id: 'userid' as any,
          username: 'test',
          email: 'hantsy@example.com',
          password: 'password',
          roles: [RoleType.USER],
          comparePassword: (_password: string) =>
            throwError(() => compareError),
        } as User & UserMethods),
      );

      await expect(
        lastValueFrom(service.validateUser('test', 'password')),
      ).rejects.toBe(compareError);
    });

    it('should default roles to an empty array when user has none', async () => {
      vi.spyOn(userService, 'findByUsername').mockReturnValue(
        of({
          _id: 'userid' as any,
          username: 'test',
          email: 'hantsy@example.com',
          password: 'password',
          comparePassword: (_password: string) => of(true),
        } as unknown as User & UserMethods),
      );

      const data = await lastValueFrom(service.validateUser('test', 'password'));
      expect(data).toEqual({
        id: 'userid',
        username: 'test',
        email: 'hantsy@example.com',
        roles: [],
      });
    });
  });

  describe('login (additional cases)', () => {
    it('should sign the refresh token with the refresh secret and expiry', async () => {
      const signSpy = vi
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('a')
        .mockResolvedValueOnce('r');

      await lastValueFrom(
        service.login({
          username: 'test',
          id: '_id',
          email: 'hantsy@example.com',
          roles: [RoleType.USER],
        }),
      );

      const payload = {
        upn: 'test',
        sub: '_id',
        email: 'hantsy@example.com',
        roles: [RoleType.USER],
      };
      expect(signSpy).toHaveBeenNthCalledWith(1, payload);
      expect(signSpy).toHaveBeenNthCalledWith(2, payload, {
        secret: 'test-refresh-secret',
        expiresIn: '7d',
      });
    });
  });

  describe('refreshToken (additional cases)', () => {
    it('should reject with UnauthorizedException when verification fails', async () => {
      vi.spyOn(jwtService, 'verifyAsync').mockRejectedValue(
        new Error('jwt expired'),
      );
      const signSpy = vi.spyOn(jwtService, 'signAsync');

      const result = lastValueFrom(service.refreshToken('expired-token'));
      await expect(result).rejects.toThrow(UnauthorizedException);
      await expect(
        lastValueFrom(service.refreshToken('expired-token')),
      ).rejects.toThrow('Invalid or expired refresh token');
      expect(signSpy).not.toHaveBeenCalled();
    });

    it('should build new tokens from the refresh token claims', async () => {
      vi.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        upn: 'alice',
        sub: 'alice-id',
        email: 'alice@example.com',
        roles: [RoleType.ADMIN],
      });
      const signSpy = vi
        .spyOn(jwtService, 'signAsync')
        .mockResolvedValueOnce('a')
        .mockResolvedValueOnce('r');

      const data = await lastValueFrom(service.refreshToken('valid'));
      expect(data).toEqual({ access_token: 'a', refresh_token: 'r' });
      expect(signSpy).toHaveBeenNthCalledWith(1, {
        upn: 'alice',
        sub: 'alice-id',
        email: 'alice@example.com',
        roles: [RoleType.ADMIN],
      });
      expect(userService.findByUsername).not.toHaveBeenCalled();
    });

    it('should propagate asynchronous signing failures unchanged', async () => {
      vi.spyOn(jwtService, 'verifyAsync').mockResolvedValue({
        upn: 'test',
        sub: '_id',
        email: 'hantsy@example.com',
        roles: [RoleType.USER],
      });
      const signError = new Error('signing failed');
      vi.spyOn(jwtService, 'signAsync').mockRejectedValue(signError);

      await expect(
        lastValueFrom(service.refreshToken('valid')),
      ).rejects.toBe(signError);
    });
  });
});

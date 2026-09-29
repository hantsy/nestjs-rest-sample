import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
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

      try {
        await lastValueFrom(service.validateUser('test', 'password001'));
      } catch (error) {
        expect(error).toBeDefined();
      }
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
});

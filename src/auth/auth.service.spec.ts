import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { RoleType } from '../common/enum/role-type.enum';
import { User } from '../database/user.model';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

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
            constructor: jest.fn(),
            findByUsername: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            constructor: jest.fn(),
            signAsync: jest.fn(),
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
      jest
        .spyOn(userService, 'findByUsername')
        .mockImplementation((username: string) => {
          return of({
            username,
            password: 'password',
            email: 'hantsy@example.com',
            roles: [RoleType.USER],
          } as User);
        });

      service.validateUser('test', 'password').subscribe({
        next: (data) => {
          expect(data.username).toBe('test');
          // expect(data.password).toBeUndefined();
          expect(data.email).toBe('hantsy@example.com');
          expect(data.roles).toEqual([RoleType.USER]);

          //verify
          expect(userService.findByUsername).toBeCalledTimes(1);
          expect(userService.findByUsername).toBeCalledWith('test');
        },
      });
    });

    it('if user is found but pass is mismatched', async () => {
      jest
        .spyOn(userService, 'findByUsername')
        .mockImplementation((username: string) => {
          return of({
            username,
            password: 'password',
            email: 'hantsy@example.com',
            roles: [RoleType.USER],
          } as User);
        });

      service
        .validateUser('test', 'password001')
        .pipe(toArray())
        .subscribe({
          next: (data) => {
            expect(data.length).toBe(0);
            expect(userService.findByUsername).toBeCalledTimes(1);
            expect(userService.findByUsername).toBeCalledWith('test');
          },
        });
    });

    it('if user is not found', async () => {
      jest
        .spyOn(userService, 'findByUsername')
        .mockImplementation((username: string) => {
          return of(null as User);
        });

      service
        .validateUser('test', 'password001')
        .pipe(toArray())
        .subscribe({
          next: (data) => {
            expect(data.length).toBe(0);
            expect(userService.findByUsername).toBeCalledTimes(1);
            expect(userService.findByUsername).toBeCalledWith('test');
          },
        });
    });
  });

  describe('login', () => {
    it('should return signed jwt token', async () => {
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('test');

      service
        .login({
          username: 'test',
          id: '_id',
          email: 'hantsy@example.com',
          roles: [RoleType.USER],
        })
        .subscribe({
          next: (data) => {
            expect(data.access_token).toBe('test');
            expect(jwtService.signAsync).toBeCalledTimes(1);
            expect(jwtService.signAsync).toBeCalledWith({
              upn: 'test',
              sub: '_id',
              email: 'hantsy@example.com',
              roles: [RoleType.USER],
            });
          },
        });
    });
  });
});

import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import { EMPTY, of } from 'rxjs';
import { RoleType } from '../../shared/enum/role-type.enum';
import { AuthService } from '../auth.service';
import { LocalStrategy } from './local.strategy';

describe('LocalStrategy', () => {
  let strategy: LocalStrategy;
  let authService: AuthService;
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        LocalStrategy,
        {
          provide: AuthService,
          useValue: {
            constructor: jest.fn(),
            login: jest.fn(),
            validateUser: jest.fn()
          },
        },
      ],
    }).compile();

    strategy = app.get<LocalStrategy>(LocalStrategy);
    authService = app.get<AuthService>(AuthService);
  });

  describe('validate', () => {
    it('should return user principal if user and password is provided ', async () => {
      jest
        .spyOn(authService, 'validateUser')
        .mockImplementation((user: any, pass: any) => {
          return of({
            username: 'test',
            id: '_id',
            email: 'hantsy@example.com',
            roles: [RoleType.USER],
          });
        });
      const user = await strategy.validate('test', 'pass');
      expect(user.username).toEqual('test');
      expect(authService.validateUser).toBeCalledWith('test', 'pass');
    });

    it('should throw UnauthorizedException  if user is not valid ', async () => {
      jest
        .spyOn(authService, 'validateUser')
        .mockImplementation((user: any, pass: any) => {
          return EMPTY;
        });

      try {
        const user = await strategy.validate('test', 'pass');
      } catch (e) {
        //console.log(e)
        expect(e).toBeDefined()
      }
      expect(authService.validateUser).toBeCalledWith('test', 'pass');
    });
  });
});

describe('LocalStrategy(call supper)', () => {
  let local;
  let parentMock;

  beforeEach(() => {
    local = Object.getPrototypeOf(LocalStrategy);
    parentMock = jest.fn();
    Object.setPrototypeOf(LocalStrategy, parentMock);
  });

  afterEach(() => {
    Object.setPrototypeOf(LocalStrategy, local);
  });

  it('call super', () => {
    new LocalStrategy(mock<AuthService>());
    expect(parentMock.mock.calls.length).toBe(1);
    expect(parentMock).toBeCalledWith({
      usernameField: 'username',
      passwordField: 'password',
    });
  })
});

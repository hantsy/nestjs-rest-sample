import { ConfigType } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { mock } from 'jest-mock-extended';
import jwtConfig from '../../config/jwt.config';
import { RoleType } from '../../shared/enum/role-type.enum';
import { JwtStrategy } from './jwt.strategy';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let config: ConfigType<typeof jwtConfig>;
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        JwtStrategy,
        {
          provide: jwtConfig.KEY,
          useValue: {
            secretKey: "test",
            expiresIn:'100s'
          },
        },
      ],
    })
    .compile();

    strategy = app.get<JwtStrategy>(JwtStrategy);
    config = app.get<ConfigType<typeof jwtConfig>>(jwtConfig.KEY);
  });

  describe('validate', () => {
    it('should return user principal if user and password is provided ', async () => {
      expect(config.secretKey).toBe('test')
      expect(config.expiresIn).toBe('100s')
      const user = await strategy.validate({
        upn: "test",
        sub: 'testid',
        email: "test@example.com",
        roles: [RoleType.USER]
      });
      expect(user.username).toEqual('test');
      expect(user.id).toEqual('testid');
    });
  });
});

describe('JwtStrategy(call supper)', () => {
  let local;
  let parentMock;

  beforeEach(() => {
    local = Object.getPrototypeOf(JwtStrategy);
    parentMock = jest.fn();
    Object.setPrototypeOf(JwtStrategy, parentMock);
  });

  afterEach(() => {
    Object.setPrototypeOf(JwtStrategy, local);
  });

  it('call super', () => {
    const config = mock<ConfigType<typeof jwtConfig>>();
    config.secretKey="test";
    new JwtStrategy(config);
    expect(parentMock.mock.calls.length).toBe(1);

    expect(parentMock.mock.calls[0][0].jwtFromRequest).toBeDefined();
    expect(parentMock.mock.calls[0][0].ignoreExpiration).toBeFalsy();
    expect(parentMock.mock.calls[0][0].secretOrKey).toEqual("test");

  })
});

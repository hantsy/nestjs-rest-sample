import { Test, TestingModule } from '@nestjs/testing';
import { of } from 'rxjs';
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
          },
        },
      ],
    }).compile();

    controller = app.get<AuthController>(AuthController);
    authService = app.get<AuthService>(AuthService);
  });

  describe('login', () => {
    it('should return access_token', async () => {
      jest.spyOn(authService, 'login').mockImplementation((user: any) => {
        return of({ access_token: 'jwttoken' });
      });
      const token = await controller.login({} as any).toPromise();
      expect(token.access_token).toEqual('jwttoken');
      expect(authService.login).toBeCalled();
    });
  });
});

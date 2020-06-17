import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AuthService } from './auth/auth.service';
import { of } from 'rxjs';

describe('AppController', () => {
  let appController: AppController;
  let authService: AuthService;
  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AuthService,
          useValue: {
            constructor: jest.fn(),
            login: jest.fn()
          },
        },
      ],
    }).compile();

    appController = app.get<AppController>(AppController);
    authService = app.get<AuthService>(AuthService);
  });

  describe('root', () => {
    it('should return access_token', async() => {
      jest.spyOn(authService, "login").mockImplementation((user:any)=>{
        return of({ access_token: 'jwttoken' } );
      });
      const token = await appController.login({} as any).toPromise();
      expect(token.access_token).toEqual('jwttoken');
      expect(authService.login).toBeCalled();
    });
  });
});

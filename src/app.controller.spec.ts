import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;
  let service: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: AppService,
          useValue: {
            constructor: jest.fn(),
            getHello: jest.fn()
          }
        }
      ],
    }).compile();

    service = app.get<AppService>(AppService);
    appController = app.get<AppController>(AppController);
  });
  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

    it('getHello',async () => {
       jest.spyOn(service, "getHello").mockReturnValue("Hello");
       expect(appController.getHello()).toEqual("Hello");
    })
});

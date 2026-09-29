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
            constructor: vi.fn(),
            getHello: vi.fn(),
          },
        },
      ],
    }).compile();

    service = app.get<AppService>(AppService);
    appController = app.get<AppController>(AppController);
  });
  it('should be defined', () => {
    expect(appController).toBeDefined();
  });

  it('getHello', async () => {
    vi.spyOn(service, 'getHello').mockReturnValue('Hello');
    expect(appController.getHello()).toEqual('Hello');
  });
});

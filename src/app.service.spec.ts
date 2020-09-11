import { Test, TestingModule } from '@nestjs/testing';
import { AppService } from './app.service';
import { LoggerService } from './logger/logger.service';

describe('AppService', () => {
  let logger: LoggerService;
  let service: AppService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      providers: [
        AppService,
        {
          provide: 'LoggerServiceAppService',
          useValue: {
            constructor: jest.fn(),
            log: jest.fn()
          }
        }
      ],
    })
      .compile();

    service = app.get<AppService>(AppService);
    logger = app.get<LoggerService>('LoggerServiceAppService');
  });
  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('getHello', async () => {
    jest.spyOn(logger, "log").mockImplementation((message: string) => {
      console.log(message);
    })
    const result = service.getHello();
    expect(result).toEqual('Hello World!');
    expect(logger.log).toBeCalledWith("Hello World");
  })
});

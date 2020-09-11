import { Test, TestingModule } from '@nestjs/testing';
import { LoggerService } from './logger.service';

describe('LoggerService', () => {
  let service: LoggerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LoggerService],
    }).compile();

    service = await module.resolve<LoggerService>(LoggerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('log', () => {
    const consoleSpy = jest.spyOn(global.console, 'log');
    service.log("hello");
    expect(consoleSpy).toBeCalledWith('hello');
  });

  it('log with prefix', () => {
    const consoleSpy = jest.spyOn(global.console, 'log');
    service.setPrefix("H")
    service.log("hello");
    expect(consoleSpy).toBeCalledWith('[H] hello');
  });
});

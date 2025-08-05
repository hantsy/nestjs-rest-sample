import { Injectable } from '@nestjs/common';
import { Logger } from './logger/logger.decorator';
import { LoggerService } from './logger/logger.service';

@Injectable()
export class AppService {
  constructor(@Logger('AppService') private readonly logger: LoggerService) {}

  getHello(): string {
    this.logger.log('Hello World');
    return 'Hello World!';
  }
}

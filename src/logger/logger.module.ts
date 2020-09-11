// src/logger/logger.module.ts

import { DynamicModule } from '@nestjs/common';
import { createLoggerProviders } from './logger.providers';
import { LoggerService } from './logger.service';

export class LoggerModule {
  static forRoot(): DynamicModule {
    const prefixedLoggerProviders = createLoggerProviders();
    return {
      module: LoggerModule,
      providers: [LoggerService, ...prefixedLoggerProviders],
      exports: [LoggerService, ...prefixedLoggerProviders],
    };
  }
}

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // enable shutdown hooks explicitly.
  app.enableShutdownHooks();
  await app.listen(3000);
}
bootstrap();

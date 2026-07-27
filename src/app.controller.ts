import { Controller, Get } from '@nestjs/common';
import { ApiOkResponse, ApiTags } from '@nestjs/swagger';
import { AppService } from './app.service';

@ApiTags('root')
@Controller()
export class AppController {
  constructor(private readonly service: AppService) {}

  @Get('')
  @ApiOkResponse({ description: 'Returns hello world greeting.' })
  getHello(): string {
    return this.service.getHello();
  }
}

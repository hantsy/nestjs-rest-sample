import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@ApiTags('profile')
@Controller()
export class ProfileController {
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'Current user profile.' })
  @ApiUnauthorizedResponse({ description: 'Not authenticated.' })
  getProfile(@Req() req: Request): any {
    return req.user;
  }
}

import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../auth/guard/jwt-auth.guard';

@Controller()
export class ProfileController {

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Req() req: Request): any {
    return req.user;
  }
}

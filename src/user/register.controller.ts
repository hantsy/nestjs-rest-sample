import { Body, ConflictException, Controller, Post, Res } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { lastValueFrom } from 'rxjs';
import { RegisterDto } from './register.dto';
import { UserService } from './user.service';

@ApiTags('auth')
@Controller('register')
export class RegisterController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @ApiCreatedResponse({ description: 'User registered successfully.' })
  @ApiConflictResponse({ description: 'Username or email already exists.' })
  async register(
    @Body() registerDto: RegisterDto,
    @Res() res: Response,
  ): Promise<Response> {
    const { username, email } = registerDto;

    const existsByUsername = await lastValueFrom(
      this.userService.existsByUsername(username),
    );
    if (existsByUsername) {
      throw new ConflictException(`username:${username} is existed`);
    }

    const existsByEmail = await lastValueFrom(
      this.userService.existsByEmail(email),
    );
    if (existsByEmail) {
      throw new ConflictException(`email:${email} is existed`);
    }

    const user = await lastValueFrom(this.userService.register(registerDto));
    return res
      .location('/users/' + user._id)
      .status(201)
      .send();
  }
}

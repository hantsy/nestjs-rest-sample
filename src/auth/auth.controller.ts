import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { AuthenticatedRequest } from './interface/authenticated-request.interface';
import { LoginResponseDto } from './dto/login-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'hantsy' },
        password: { type: 'string', example: 'password' },
      },
    },
  })
  @ApiCreatedResponse({
    description: 'Login successful.',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  login(
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ): Observable<Response> {
    return this.authService.login(req.user).pipe(
      map((token) => {
        return res
          .header('Authorization', 'Bearer ' + token.access_token)
          .json(token)
          .send();
      }),
    );
  }
}

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { AuthenticatedRequest } from './interface/authenticated-request.interface';
import { LoginResponseDto } from './dto/login-response.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        username: { type: 'string', example: 'hantsy' },
        password: { type: 'string', example: 'password' },
      },
    },
  })
  @ApiOkResponse({ description: 'Login successful.', type: LoginResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  login(@Req() req: AuthenticatedRequest): Observable<LoginResponseDto> {
    return this.authService.login(req.user);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBody({ type: RefreshTokenDto })
  @ApiOkResponse({
    description: 'Tokens refreshed successfully.',
    type: LoginResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid or expired refresh token.' })
  refresh(@Body() dto: RefreshTokenDto): Observable<LoginResponseDto> {
    return this.authService.refreshToken(dto.refresh_token);
  }
}

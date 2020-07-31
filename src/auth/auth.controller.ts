import { Controller, UseGuards, Post, Req, Res } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from '../common/guard/local-auth.guard';
import { Observable } from 'rxjs';
import { Request, Response } from 'express';
import { AuthenticatedRequest } from './authenticated-request.interface';
import { map } from 'rxjs/operators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) { }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  login(@Req() req: AuthenticatedRequest, @Res() res: Response): Observable<Response> {
    return this.authService.login(req.user)
      .pipe(
        map(token => {
          return res
            .header('Authorization', 'Bearer ' + token.access_token)
            .json(token)
            .send()
        })
      );
  }
}

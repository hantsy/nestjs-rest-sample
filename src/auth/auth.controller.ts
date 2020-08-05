import { Controller, Post, Req, Res, UseGuards } from '@nestjs/common';
import { Response } from 'express';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { AuthenticatedRequest } from './interface/authenticated-request.interface';

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

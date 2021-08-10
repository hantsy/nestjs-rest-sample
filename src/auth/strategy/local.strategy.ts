import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { lastValueFrom } from 'rxjs';
import { AuthService } from '../auth.service';
import { UserPrincipal } from '../interface/user-principal.interface';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private authService: AuthService) {
    super({
      usernameField: 'username',
      passwordField: 'password',
    });
  }

  // When using Observable as return type, the exeption in the pipeline is ignored.
  // In our case, the `UnauthorizedException` is **NOT** caught and handled as expected.
  // The flow is NOT prevented by the exception and continue to send a `Observable` to
  // the next step aka calling `this.authService.login` in `AppController#login` method.
  // Then the jwt token is generated in any case(eg. wrong username or wrong password),
  // the authenticatoin worflow does not work as expected.
  //
  // The solution is customizing `PassportSerializer`.
  // Example: https://github.com/jmcdo29/zeldaPlay/blob/master/apps/api/src/app/auth/session.serializer.ts
  //
  // validate(username: string, password: string): Observable<any> {
  //   return this.authService
  //     .validateUser(username, password)
  //     .pipe(throwIfEmpty(() => new UnauthorizedException()));
  // }

  async validate(username: string, password: string): Promise<UserPrincipal> {
    const user: UserPrincipal = await lastValueFrom(
      this.authService.validateUser(username, password),
    );

    if (!user) {
      throw new UnauthorizedException();
    }

    return user;
  }
}

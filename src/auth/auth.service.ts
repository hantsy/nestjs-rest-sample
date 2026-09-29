import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigType } from '@nestjs/config';
import { EMPTY, from, Observable, of } from 'rxjs';
import { mergeMap, map, throwIfEmpty } from 'rxjs/operators';
import jwtConfig from '../config/jwt.config';
import { UserService } from '../user/user.service';
import { AccessToken } from './interface/access-token.interface';
import { JwtPayload as TokenPayload } from './interface/jwt-payload.interface';
import { UserPrincipal } from './interface/user-principal.interface';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
    @Inject(jwtConfig.KEY)
    private jwtConf: ConfigType<typeof jwtConfig>,
  ) {}

  /**
   * Checks the plaintext password and emits the user's principal on a match.
   * Errors with UnauthorizedException (INVALID_CREDENTIALS) for a password mismatch
   * or a lookup that completes without a user. Lookup errors, including
   * USER_NOT_FOUND, and password comparison errors propagate unchanged.
   */
  validateUser(username: string, pass: string): Observable<UserPrincipal> {
    return this.userService.findByUsername(username).pipe(
      mergeMap((p) => (p ? of(p) : EMPTY)),
      throwIfEmpty(
        () =>
          new UnauthorizedException(`username or password is not matched`, {
            errorCode: 'INVALID_CREDENTIALS',
          }),
      ),
      mergeMap((user) => {
        const { _id, password, username, email, roles } = user;
        return user.comparePassword(pass).pipe(
          map((m) => {
            if (m) {
              return {
                id: _id.toString(),
                username,
                email,
                roles: roles ?? [],
              };
            } else {
              throw new UnauthorizedException(
                'username or password is not matched',
                { errorCode: 'INVALID_CREDENTIALS' },
              );
            }
          }),
        );
      }),
    );
  }

  private buildPayload(user: UserPrincipal): TokenPayload {
    return {
      upn: user.username,
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
  }

  login(user: UserPrincipal): Observable<AccessToken> {
    const payload = this.buildPayload(user);
    return from(
      Promise.all([
        this.jwtService.signAsync(payload),
        this.jwtService.signAsync(payload, {
          secret: this.jwtConf.refreshSecretKey,
          expiresIn: this.jwtConf.refreshExpiresIn as any,
        }),
      ]).then(([access_token, refresh_token]) => ({
        access_token,
        refresh_token,
      })),
    );
  }

  /**
   * Verifies a refresh token and emits a new access/refresh token pair from its
   * claims, without reloading the user or invalidating the supplied token.
   * Verification failures and synchronous errors while preparing the new tokens
   * become UnauthorizedException (INVALID_REFRESH_TOKEN). Asynchronous signing
   * failures propagate unchanged through the returned observable.
   */
  refreshToken(refreshToken: string): Observable<AccessToken> {
    return from(
      this.jwtService
        .verifyAsync<TokenPayload>(refreshToken, {
          secret: this.jwtConf.refreshSecretKey,
        })
        .then((payload) => {
          const user: UserPrincipal = {
            id: payload.sub,
            username: payload.upn,
            email: payload.email,
            roles: payload.roles,
          };
          return this.login(user);
        })
        .catch(() => {
          throw new UnauthorizedException('Invalid or expired refresh token', {
            errorCode: 'INVALID_REFRESH_TOKEN',
          });
        }),
    ).pipe(mergeMap((result) => result));
  }
}

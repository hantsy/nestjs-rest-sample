import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { from, Observable, EMPTY, of } from 'rxjs';
import { map, flatMap } from 'rxjs/operators';
import { UserService } from '../user/user.service';
import { UserPrincipal } from './user-principal.interface';
import { JwtPayload } from './jwt-payload.interface';
import { AccessToken } from './access-token.interface';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  validateUser(username: string, pass: string): Observable<UserPrincipal> {
    return this.userService.findByUsername(username).pipe(
      flatMap((user) => {
        //console.log('userService.findByUsername::' + JSON.stringify(user));
        if (user && user.password === pass) {
          const { _id, username, email, roles } = user;
          return of({ id: _id, username, email, roles });
        }
        return EMPTY;
      }),
    );
  }

  // If `LocalStrateg#validateUser` return a `Observable`, the `request.user` is
  // bound to a `Observable<UserPrincipal>`, not a `UserPrincipal`.
  //
  // I would like use the current `Promise` for this case, thus it will get
  // a `UserPrincipal` here directly.
  //
  login(user: UserPrincipal): Observable<AccessToken> {
    //console.log(user);
    const payload: JwtPayload = {
      upn: user.username, //upn is defined in Microprofile JWT spec, a human readable principal name.
      sub: user.id,
      email: user.email,
      roles: user.roles,
    };
    return from(this.jwtService.signAsync(payload)).pipe(
      map((access_token) => {
        return { access_token };
      }),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { JwtService } from '@nestjs/jwt';
import { map } from 'rxjs/operators';
import { Observable, of, from } from 'rxjs';
import { User } from 'src/user/user.model';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  validateUser(username: string, pass: string): Observable<any> {
    return this.userService.findByUsername(username).pipe(
      map(user => {
        if (user && user.password === pass) {
          const { password, ...result } = user;
          return result;
        }
        return null;
      }),
    );
  }

  login(user: Partial<User>): Observable<any> {
    const payload = { sub: user.username, email: user.email };
    return from(this.jwtService.signAsync(payload)).pipe(
      map(access_token => { access_token }),
    );
  }
}

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { jwtConstants } from './auth.constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  //payload is the decoded jwt clmais.
  validate(payload: any): any {
    //console.log('jwt payload:' + JSON.stringify(payload));
    return {
      username: payload.upn,
      email: payload.email,
      _id: payload.sub,
      roles: payload.roles,
    };

  }
}

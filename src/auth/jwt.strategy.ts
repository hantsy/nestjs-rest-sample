import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy ,AbstractStrategy} from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { jwtConstants } from './constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
  }

  validate(payload: any) :any{
    return { email: payload.email, sub: payload.username };
  }
}

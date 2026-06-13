import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { JwtConfig } from '../constants';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: JwtConfig.secret, // A mesma chave usada para assinar
    });
  }

  // O que este método retorna é injetado no objeto 'req.user'
  async validate(payload: any) {
    return { 
      userId: payload.sub, 
      email: payload.username, 
      cargo: payload.cargo 
    };
  }
}
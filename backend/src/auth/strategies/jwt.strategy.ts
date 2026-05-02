import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

export interface JwtPayload {
  sub: string;
  role: string;
  branchId: string;
  restaurantId?: string;
}

function getRequiredJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is required');
  }
  return secret;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: getRequiredJwtSecret(),
    });
  }

  validate(payload: JwtPayload) {
    return { 
      id: payload.sub, 
      userId: payload.sub, 
      role: payload.role, 
      branchId: payload.branchId,
      restaurantId: payload.restaurantId
    };
  }
}

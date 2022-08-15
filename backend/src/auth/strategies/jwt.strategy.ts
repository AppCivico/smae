import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PessoaFromJwt } from '../models/PessoaFromJwt';
import { JwtPessoaPayload } from '../models/JwtPessoaPayload';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor() {
        console.log('ExtractJwt.fromAuthHeaderAsBearerToken')
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.SESSION_JWT_SECRET,
        });
    }

    async validate(payload: JwtPessoaPayload): Promise<PessoaFromJwt> {
        return {
            id: payload.id,
        };
    }
}
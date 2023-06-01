import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JwtPessoaPayload } from '../models/JwtPessoaPayload';
import { PessoaFromJwt } from '../models/PessoaFromJwt';
import { AuthService } from './../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.SESSION_JWT_SECRET,
            audience: 'l',
        });
    }

    async validate(payload: JwtPessoaPayload): Promise<PessoaFromJwt> {
        return await this.authService.pessoaJwtFromSessionId(payload.sid);
    }
}

import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PessoaFromJwt } from '../models/PessoaFromJwt';
import { JwtPessoaPayload } from '../models/JwtPessoaPayload';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(private authService: AuthService) {

        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: process.env.SESSION_JWT_SECRET,
        });
    }

    async validate(payload: JwtPessoaPayload): Promise<PessoaFromJwt> {
        const pessoa = await this.authService.pessoaPeloSessionId(payload.sid);

        return {
            id: pessoa.id as number,
            nome_exibicao: pessoa.nome_exibicao,
            session_id: payload.sid,
        };
    }
}
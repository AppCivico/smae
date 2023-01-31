import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PessoaFromJwt } from '../models/PessoaFromJwt';
import { JwtPessoaPayload } from '../models/JwtPessoaPayload';
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
        const pessoa = await this.authService.pessoaPeloSessionId(payload.sid);

        const modPriv = await this.authService.listaPrivilegiosPessoa(pessoa.id as number);

        return new PessoaFromJwt({
            id: pessoa.id as number,
            nome_exibicao: pessoa.nome_exibicao,
            session_id: payload.sid,
            modulos: modPriv.modulos,
            privilegios: modPriv.privilegios,
            orgao_id: pessoa.pessoa_fisica?.orgao_id,
        });
    }
}

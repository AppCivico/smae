import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedError } from './errors/unauthorized.error';
import { Pessoa } from '../pessoa/entities/pessoa.entity';
import { PessoaService } from '../pessoa/pessoa.service';
import { JwtPessoaPayload } from './models/JwtPessoaPayload';
import { AccessToken } from './models/AccessToken';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly pessoaService: PessoaService,
    ) { }

    async login(pessoa: Pessoa): Promise<AccessToken> {

        const sessaoId = await this.pessoaService.newSessionForPessoa(pessoa.id as number);
        const payload: JwtPessoaPayload = {
            sid: sessaoId,
            iat: Date.now(),
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async logout(pessoa: Pessoa) {
        await this.pessoaService.removeSessionForPessoa(pessoa.session_id as number);
    }

    async pessoaPeloEmailSenha(email: string, senhaInformada: string): Promise<Pessoa> {
        const pessoa = await this.pessoaService.findByEmail(email);
        if (pessoa) {
            const isPasswordValid = await bcrypt.compare(senhaInformada, pessoa.senha);

            if (isPasswordValid) {
                console.log('returning ', pessoa);
                return pessoa as Pessoa;
            }
        }

        throw new UnauthorizedError(
            'email| E-mail ou senha inválidos',
        );
    }


    async pessoaPeloSessionId(id: number): Promise<Pessoa> {
        const pessoa = await this.pessoaService.findBySessionId(id);
        if (pessoa) {
            return pessoa;
        }
        throw new UnauthorizedError('Sessão não está mais ativa');
    }

}
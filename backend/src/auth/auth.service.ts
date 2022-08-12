import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UnauthorizedError } from './errors/unauthorized.error';
import { Pessoa } from '../pessoa/entities/pessoa.entity';
import { PessoaService } from '../pessoa/pessoa.service';
import { JwtPessoaPayload } from './models/JwtPessoaPayload';
import { AuthToken } from './models/AuthToken';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly pessoaService: PessoaService,
    ) { }

    async login(pessoa: Pessoa): Promise<AuthToken> {
        const payload: JwtPessoaPayload = {
            id: pessoa.id as number,
            iat: Date.now(),
        };

        return {
            access_token: this.jwtService.sign(payload),
        };
    }

    async pessoaPeloEmailSenha(email: string, senhaInformada: string): Promise<Pessoa> {
        const pessoa = await this.pessoaService.findByEmail(email);
        if (pessoa) {
            const isPasswordValid = await bcrypt.compare(senhaInformada, pessoa.senha);

            if (isPasswordValid) {
                console.log('returning ',  pessoa);
                return pessoa as Pessoa;
            }
        }

        throw new UnauthorizedError(
            'email| E-mail ou senha inválidos',
        );
    }
}
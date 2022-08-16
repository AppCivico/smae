import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UnauthorizedError } from './errors/unauthorized.error';
import { Pessoa } from '../pessoa/entities/pessoa.entity';
import { PessoaService } from '../pessoa/pessoa.service';
import { JwtPessoaPayload } from './models/JwtPessoaPayload';
import { AccessToken } from './models/AccessToken';
import { ReducedAccessToken } from 'src/auth/models/ReducedAccessToken';
import { JwtReducedAccessToken } from 'src/auth/models/JwtReducedAccessToken';
import { EscreverNovaSenhaRequestBody } from 'src/auth/models/EscreverNovaSenhaRequestBody.dto';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly pessoaService: PessoaService,
    ) { }

    async login(pessoa: Pessoa): Promise<AccessToken | ReducedAccessToken> {

        if (pessoa.senha_bloqueada) {

            const payload: JwtReducedAccessToken = {
                aud: 'resetPass',
                pessoaId: pessoa.id as number,
                iat: Date.now(),
            };

            return {
                reduced_access_token: this.jwtService.sign(payload, { expiresIn: '10m' }),
            } as ReducedAccessToken

        }

        return this.#criarSession(pessoa.id as number);
    }

    async #criarSession(pessoaId: number) {
        const sessaoId = await this.pessoaService.newSessionForPessoa(pessoaId);
        const payload: JwtPessoaPayload = {
            sid: sessaoId,
            iat: Date.now(),
        };

        return {
            access_token: this.jwtService.sign(payload),
        } as AccessToken
    }

    async logout(pessoa: Pessoa) {
        await this.pessoaService.removeSessionForPessoa(pessoa.session_id as number);
    }

    async pessoaPeloEmailSenha(email: string, senhaInformada: string): Promise<Pessoa> {
        const pessoa = await this.pessoaService.findByEmail(email);

        if (!pessoa)
            throw new UnauthorizedError('email| E-mail ou senha inválidos');

        let isPasswordValid = await this.pessoaService.senhaCorreta(senhaInformada, pessoa);
        if (!isPasswordValid) {
            if (pessoa.senha_bloqueada)
                throw new UnauthorizedError('email| Conta está bloqueada, acesse o e-mail para recuperar a conta');

            await this.pessoaService.incrementarSenhaInvalida(pessoa);
            throw new UnauthorizedError('email| E-mail ou senha inválidos');
        }

        return pessoa as Pessoa;
    }


    async pessoaPeloSessionId(id: number): Promise<Pessoa> {
        const pessoa = await this.pessoaService.findBySessionId(id);
        if (pessoa) {
            return pessoa;
        }
        throw new UnauthorizedError('Sessão não está mais ativa');
    }

    async escreverNovaSenha(body: EscreverNovaSenhaRequestBody) {
        let result: JwtReducedAccessToken;
        try {
            result = this.jwtService.verify(body.reduced_access_token);
        } catch {
            throw new BadRequestException('reduced_access_token: inválido');
        }


        await this.pessoaService.escreverNovaSenhaById(result.pessoaId, body.senha);

        return this.#criarSession(result.pessoaId);

    }
}
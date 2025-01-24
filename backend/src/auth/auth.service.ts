import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { FeatureFlagService } from '../feature-flag/feature-flag.service';
import { Pessoa } from '../pessoa/entities/pessoa.entity';
import { PessoaService } from '../pessoa/pessoa.service';
import { UnauthorizedError } from './errors/unauthorized.error';
import { AccessToken } from './models/AccessToken';
import { EscreverNovaSenhaRequestBody } from './models/EscreverNovaSenhaRequestBody.dto';
import { JwtPessoaPayload } from './models/JwtPessoaPayload';
import { JwtReducedAccessToken } from './models/JwtReducedAccessToken';
import { PessoaFromJwt } from './models/PessoaFromJwt';
import { ReducedAccessToken } from './models/ReducedAccessToken';
import { SolicitarNovaSenhaRequestBody } from './models/SolicitarNovaSenhaRequestBody.dto';
import { ModuloSistema } from '@prisma/client';

@Injectable()
export class AuthService {
    constructor(
        private readonly jwtService: JwtService,
        private readonly pessoaService: PessoaService,
        private readonly featureFlagService: FeatureFlagService
    ) {}

    async login(pessoa: Pessoa, ip: string): Promise<AccessToken | ReducedAccessToken> {
        if (pessoa.senha_bloqueada) {
            const payload: JwtReducedAccessToken = {
                aud: 'resetPass',
                pessoaId: pessoa.id as number,
            };

            return {
                reduced_access_token: this.jwtService.sign(payload, { expiresIn: '10 minutes' }),
            } as ReducedAccessToken;
        }

        if (pessoa.desativado) {
            throw new BadRequestException('email| Conta não está mais ativa.');
        }

        return this.criarSession(pessoa.id as number, ip);
    }

    async criarSession(pessoaId: number, ip: string) {
        const sessaoId = await this.pessoaService.newSessionForPessoa(pessoaId, ip);
        const payload: JwtPessoaPayload = {
            sid: sessaoId,
            iat: Date.now(),
            aud: 'l',
        };

        return {
            access_token: this.jwtService.sign(payload),
        } as AccessToken;
    }

    async logout(pessoa: Pessoa, ip: string) {
        await this.pessoaService.invalidarSessao(pessoa.session_id as number, ip);
    }

    async pessoaPeloEmailSenha(email: string, senhaInformada: string): Promise<Pessoa> {
        const pessoa = await this.pessoaService.findByEmail(email);

        if (!pessoa) throw new BadRequestException('email| E-mail ou senha inválidos');

        const isPasswordValid = await this.pessoaService.senhaCorreta(senhaInformada, pessoa);
        if (!isPasswordValid) {
            if (pessoa.senha_bloqueada)
                throw new BadRequestException('email| Conta está bloqueada, acesse o e-mail para recuperar a conta');

            await this.pessoaService.incrementarSenhaInvalida(pessoa);
            throw new BadRequestException('email| E-mail ou senha inválidos');
        }

        return pessoa;
    }

    async pessoaJwtFromId(pessoa_id: number): Promise<PessoaFromJwt> {
        const pessoa = await this.pessoaPeloId(pessoa_id);

        const modPriv = await this.listaPrivilegiosPessoa(pessoa.id as number, undefined);
        const modulo_sistema: ModuloSistema[] = this.calcModuloSistema(undefined);

        return new PessoaFromJwt({
            id: pessoa.id as number,
            nome_exibicao: pessoa.nome_exibicao,
            session_id: 0,
            privilegios: modPriv.privilegios,
            sistemas: modPriv.sistemas,
            orgao_id: pessoa.pessoa_fisica?.orgao_id,
            flags: await this.featureFlagService.featureFlag(),
            modulo_sistema,
            ip: null,
            equipe_pdm_tipos: pessoa.equipe_pdm_tipos,
            modulos_permitidos: pessoa.modulos_permitidos,
            sobreescrever_modulos: pessoa.sobreescrever_modulos,
        });
    }

    async pessoaJwtFromSessionId(
        session_id: number,
        filterModulos: ModuloSistema[] | undefined
    ): Promise<PessoaFromJwt> {
        const pessoa = await this.pessoaPeloSessionId(session_id);

        const modPriv = await this.listaPrivilegiosPessoa(pessoa.id as number, filterModulos);

        const modulo_sistema: ModuloSistema[] = this.calcModuloSistema(filterModulos);

        return new PessoaFromJwt({
            id: pessoa.id as number,
            nome_exibicao: pessoa.nome_exibicao,
            session_id: session_id,
            privilegios: modPriv.privilegios,
            sistemas: modPriv.sistemas,
            orgao_id: pessoa.pessoa_fisica?.orgao_id,
            flags: await this.featureFlagService.featureFlag(),
            modulo_sistema,
            ip: null,
            equipe_pdm_tipos: pessoa.equipe_pdm_tipos,
            modulos_permitidos: pessoa.modulos_permitidos,
            sobreescrever_modulos: pessoa.sobreescrever_modulos,
        });
    }

    private calcModuloSistema(filterModulos: ModuloSistema[] | undefined) {
        // retorna os módulos que a pessoa enviou, exceto o próprio SMAE
        let modulo_sistema: ModuloSistema[] = filterModulos
            ? filterModulos.filter((r) => r != 'SMAE')
            : (Object.keys(ModuloSistema) as ModuloSistema[]);
        modulo_sistema = modulo_sistema.filter((r) => r != 'SMAE');
        return modulo_sistema;
    }

    async pessoaPeloSessionId(id: number): Promise<Pessoa> {
        const pessoa = await this.pessoaService.findBySessionId(id);
        if (pessoa) {
            if (pessoa.pessoa_fisica === null)
                throw new UnauthorizedError(`Pessoa ID ${pessoa.id} não tem pessoa_fisica associada`);
            return pessoa;
        }
        throw new UnauthorizedError('Sessão não está mais ativa');
    }

    async pessoaPeloId(id: number): Promise<Pessoa> {
        const pessoa = await this.pessoaService.findById(id);
        if (pessoa) {
            if (pessoa.pessoa_fisica === null)
                throw new UnauthorizedError(`Pessoa ID ${pessoa.id} não tem pessoa_fisica associada`);
            return pessoa satisfies Pessoa;
        }
        throw new UnauthorizedError('Pessoa não está mais ativa');
    }

    async listaPrivilegiosPessoa(pessoaId: number, filterModulos: ModuloSistema[] | undefined) {
        return await this.pessoaService.listaPrivilegiosModulos(pessoaId, filterModulos);
    }

    async escreverNovaSenha(body: EscreverNovaSenhaRequestBody, ip: string) {
        let result: JwtReducedAccessToken;
        try {
            result = this.jwtService.verify(body.reduced_access_token, {
                audience: 'resetPass',
            });
        } catch {
            throw new BadRequestException('reduced_access_token| token inválido');
        }

        const updated = await this.pessoaService.escreverNovaSenhaById(result.pessoaId, body.senha);
        if (updated) {
            return this.criarSession(result.pessoaId, ip);
        } else {
            throw new BadRequestException('reduced_access_token| a senha já foi atualizada!');
        }
    }

    async solicitarNovaSenha(body: SolicitarNovaSenhaRequestBody) {
        const pessoa = await this.pessoaService.findByEmail(body.email);

        if (!pessoa) throw new BadRequestException('email| E-mail não encontrado');

        if (
            pessoa.senha_bloqueada &&
            pessoa.senha_bloqueada_em &&
            Date.now() - pessoa.senha_bloqueada_em.getTime() < 60 * 1000
        )
            throw new BadRequestException('email| Solicitação já foi efetuada recentemente. Conferia seu e-mail.');

        await this.pessoaService.criaNovaSenha(pessoa, true);
    }
}

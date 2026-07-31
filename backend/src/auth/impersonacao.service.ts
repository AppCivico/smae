import { HttpException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { SmaeConfigService } from '../common/services/smae-config.service';
import { PessoaService } from '../pessoa/pessoa.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from './auth.service';
import { CriarImpersonacaoDto, ImpersonacaoCriadaDto } from './models/Impersonacao.dto';
import { AccessToken } from './models/AccessToken';
import { PessoaFromJwt } from './models/PessoaFromJwt';
import { ListaDePrivilegios } from '../common/ListaDePrivilegios';

/**
 * Tempo de vida do token de uso único. O resgate é automático pelo navegador logo após o
 * redirecionamento, então é curto de propósito: o token sozinho é suficiente para logar.
 */
const TOKEN_TTL_SEGUNDOS = 120;

/** Duração da sessão criada pelo token. Bem menor que os 30d de um login normal. */
const SESSAO_POR_TOKEN_TTL = '2h';

/**
 * Privilégios que impedem alguém de ser personificado. Sem isso, um(a) sysadmin poderia
 * personificar outro(a) sysadmin — o que não escala privilégio, mas apaga o rastro de quem
 * de fato agiu, e permitiria encadear personificações.
 */
const PRIVILEGIOS_NAO_PERSONIFICAVEIS: ListaDePrivilegios[] = ['SMAE.sysadmin'];

@Injectable()
export class ImpersonacaoService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly authService: AuthService,
        private readonly pessoaService: PessoaService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    private hash(token: string): string {
        return crypto.createHash('sha256').update(token).digest('hex');
    }

    async criarToken(dto: CriarImpersonacaoDto, user: PessoaFromJwt, ip: string): Promise<ImpersonacaoCriadaDto> {
        const logger = LoggerWithLog('Impersonação: Criar token');

        if (dto.pessoa_id === user.id) throw new HttpException('Não é possível personificar a si mesmo.', 400);

        if (!user.session_id || user.session_id <= 0)
            throw new HttpException('Sessão inválida para criar uma personificação.', 400);

        const alvo = await this.prisma.pessoa.findFirst({
            where: { id: dto.pessoa_id, AND: [{ id: { gt: 0 } }] },
            select: { id: true, nome_exibicao: true, desativado: true, pessoa_fisica: { select: { id: true } } },
        });
        if (!alvo) throw new HttpException('Pessoa não encontrada', 404);
        if (alvo.desativado) throw new HttpException('Pessoa está desativada e não pode ser personificada.', 400);
        if (!alvo.pessoa_fisica)
            throw new HttpException('Pessoa não tem pessoa física associada e não pode ser personificada.', 400);

        await this.assertAlvoPersonificavel(alvo.id);

        const token = crypto.randomBytes(32).toString('base64url');
        const agora = new Date(Date.now());
        const expiraEm = new Date(agora.getTime() + TOKEN_TTL_SEGUNDOS * 1000);

        logger.warn(
            `Pessoa ${user.id} (sessão ${user.session_id}) criou token para personificar a pessoa ${alvo.id} (${alvo.nome_exibicao}). Motivo: ${dto.motivo}`
        );

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.pessoaImpersonacaoToken.create({
                data: {
                    token_hash: this.hash(token),
                    criado_por_pessoa_id: user.id,
                    criado_por_sessao_id: user.session_id,
                    alvo_pessoa_id: alvo.id,
                    motivo: dto.motivo,
                    criado_em: agora,
                    criado_ip: ip,
                    expira_em: expiraEm,
                },
            });

            await logger.saveLogs(prismaTx, user.getLogData());
        });

        // nunca montar a URL a partir do Host da requisição: viraria um canal de exfiltração do token
        const baseUrl = await this.smaeConfigService.getBaseUrl('URL_LOGIN_SMAE');

        return {
            // o token vai no fragmento: navegadores não o enviam ao servidor, então ele não
            // aparece em log de acesso do nginx, em Referer, nem em api_request_log
            url: `${baseUrl}/login-por-token#t=${token}`,
            expira_em: expiraEm,
            pessoa_id: alvo.id,
            nome_exibicao: alvo.nome_exibicao,
        };
    }

    /**
     * Recusa personificar quem tem privilégio de sysadmin, e aproveita a própria
     * `listaPrivilegiosModulos` (que já barra `SMAE.login_suspenso` e conta sem perfil)
     * para falhar aqui, com mensagem clara, em vez de só na hora de usar o token.
     */
    private async assertAlvoPersonificavel(alvoId: number): Promise<void> {
        let privilegios: ListaDePrivilegios[];
        try {
            privilegios = (await this.pessoaService.listaPrivilegiosModulos(alvoId, undefined)).privilegios;
        } catch (error) {
            throw new HttpException(
                `Pessoa não pode ser personificada: ${error instanceof Error ? error.message : error}`,
                400
            );
        }

        const bloqueados = PRIVILEGIOS_NAO_PERSONIFICAVEIS.filter((priv) => privilegios.includes(priv));
        if (bloqueados.length)
            throw new HttpException(
                `Pessoa não pode ser personificada por ter privilégio de administração: ${bloqueados.join(', ')}`,
                400
            );
    }

    /**
     * Consome o token de uso único e devolve uma sessão da pessoa alvo.
     *
     * Endpoint público: quem apresenta o token válido loga. É o que torna o fluxo um
     * "login por token" simples do lado do frontend, e por isso o token é aleatório de
     * 32 bytes, de uso único e vive apenas TOKEN_TTL_SEGUNDOS.
     */
    async loginPorToken(token: string, ip: string): Promise<AccessToken> {
        const logger = LoggerWithLog('Impersonação: Usar token');
        const agora = new Date(Date.now());
        const tokenHash = this.hash(token);

        const { sessaoId, alvoId, alvoNome, criadoPor } = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                // consumo atômico: o updateMany só acerta a linha se ela ainda estiver não usada e
                // dentro da validade, então um segundo resgate (ou dois simultâneos) não passa
                const consumidos = await prismaTx.pessoaImpersonacaoToken.updateMany({
                    where: {
                        token_hash: tokenHash,
                        usado_em: null,
                        expira_em: { gt: agora },
                    },
                    data: { usado_em: agora, usado_ip: ip },
                });
                if (consumidos.count !== 1) throw new HttpException('Token inválido, expirado ou já utilizado.', 400);

                const registro = await prismaTx.pessoaImpersonacaoToken.findFirstOrThrow({
                    where: { token_hash: tokenHash },
                    select: {
                        id: true,
                        motivo: true,
                        criado_por_pessoa_id: true,
                        criado_por_sessao_id: true,
                        alvo_pessoa: { select: { id: true, nome_exibicao: true, desativado: true } },
                    },
                });

                // revalida no momento do uso: a conta pode ter sido desativada depois de emitido
                if (registro.alvo_pessoa.desativado)
                    throw new HttpException('Pessoa está desativada e não pode ser personificada.', 400);

                const sessaoId = await this.pessoaService.newSessionForPessoa(registro.alvo_pessoa.id, ip, {
                    impersonadoPorPessoaId: registro.criado_por_pessoa_id,
                    prismaTx,
                });

                await prismaTx.pessoaImpersonacaoToken.update({
                    where: { id: registro.id },
                    data: { sessao_criada_id: sessaoId },
                });

                logger.warn(
                    `Pessoa ${registro.criado_por_pessoa_id} iniciou personificação da pessoa ${registro.alvo_pessoa.id} (${registro.alvo_pessoa.nome_exibicao}) na sessão ${sessaoId}. Motivo: ${registro.motivo}`
                );
                await logger.saveLogs(prismaTx, {
                    pessoa_id: registro.criado_por_pessoa_id,
                    pessoa_sessao_id: registro.criado_por_sessao_id,
                    ip,
                });

                return {
                    sessaoId,
                    alvoId: registro.alvo_pessoa.id,
                    alvoNome: registro.alvo_pessoa.nome_exibicao,
                    criadoPor: registro.criado_por_pessoa_id,
                };
            }
        );

        // registra também na linha do tempo da pessoa personificada, para quem audita
        // a conta dela enxergar a personificação sem precisar cruzar tabelas
        const loggerAlvo = LoggerWithLog('Impersonação: Sessão criada');
        loggerAlvo.warn(`Sessão ${sessaoId} de ${alvoNome} criada por personificação da pessoa ${criadoPor}.`);
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await loggerAlvo.saveLogs(prismaTx, { pessoa_id: alvoId, pessoa_sessao_id: sessaoId, ip });
        });

        return this.authService.assinarSession(sessaoId, { expiresIn: SESSAO_POR_TOKEN_TTL });
    }
}

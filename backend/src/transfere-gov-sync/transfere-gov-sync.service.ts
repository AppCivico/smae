import { HttpException, Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Cron, CronExpression } from '@nestjs/schedule';
import {
    ComunicadoTipo,
    ComunicadoTransfereGov,
    Prisma,
    TransfereGovOportunidade,
    TransfereGovOportunidadeAvaliacao,
    TransfereGovOportunidadeTipo,
} from '@prisma/client';
import { DateTime } from 'luxon';
import { uuidv7 } from 'uuidv7';
import { BlocoNotaService } from '../bloco-nota/bloco-nota/bloco-nota.service';
import { NotaService } from '../bloco-nota/nota/nota.service';
import { CONST_BOT_USER_ID, CONST_PERFIL_CASA_CIVIL, CONST_TIPO_NOTA_TRANSF_GOV } from '../common/consts';
import { Date2YMD, SYSTEM_TIMEZONE } from '../common/date2ymd';
import { JOB_TRANSFERE_GOV_LOCK } from '../common/dto/locks';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from '../common/dto/paginated.dto';
import { SmaeConfigService } from '../common/services/smae-config.service';
import { PrismaService } from '../prisma/prisma.service';
import {
    TransfGovComunicado,
    TransfGovTransferencia,
    TransfereGovApiService,
    TransfereGovApiTransferenciasService,
    TransfereGovError,
} from '../transfere-gov-api/transfere-gov-api.service';
import {
    FilterTransfereGovListDto,
    FilterTransfereGovTransferenciasDto,
    TransfereGovDto,
    TransfereGovTransferenciasDto,
    UpdateTransfereGovTransferenciaDto,
} from './entities/transfere-gov-sync.entity';
import { PessoaFromJwt } from 'src/auth/models/PessoaFromJwt';
import * as crypto from 'crypto';
import { PrismaHelpers } from 'src/common/PrismaHelpers';
const convertToJsonString = require('fast-json-stable-stringify');

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}

@Injectable()
export class TransfereGovSyncService {
    private readonly logger = new Logger(TransfereGovSyncService.name);
    baseUrl: string;
    constructor(
        private readonly prisma: PrismaService,
        private readonly transfereGovApi: TransfereGovApiService,
        private readonly transfereGovApiTransferencias: TransfereGovApiTransferenciasService,
        private readonly blocosService: BlocoNotaService,
        private readonly notaService: NotaService,
        private readonly jwtService: JwtService,
        private readonly smaeConfigService: SmaeConfigService
    ) {
        const parsedUrl = new URL(process.env.URL_LOGIN_SMAE || 'http://smae-frontend/');
        this.baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}`;
    }

    private transformComunicado(
        comunicado: TransfGovComunicado,
        tipo: ComunicadoTipo
    ): Prisma.ComunicadoTransfereGovCreateInput {
        return {
            numero: comunicado.numero,
            ano: comunicado.ano,
            titulo: comunicado.titulo,
            link: comunicado.link,
            publicado_em: comunicado.data,
            descricao: comunicado.descricao,
            tipo: tipo,
        };
    }

    private async syncComunicados(
        comunicados: TransfGovComunicado[],
        tipo: ComunicadoTipo
    ): Promise<ComunicadoTransfereGov[]> {
        const newItems: ComunicadoTransfereGov[] = [];

        const now = new Date();
        for (const comunicado of comunicados) {
            const transformedComunicado = this.transformComunicado(comunicado, tipo);

            try {
                const result = await this.prisma.comunicadoTransfereGov.upsert({
                    where: {
                        tipo_numero_ano_titulo: {
                            tipo: transformedComunicado.tipo,
                            numero: transformedComunicado.numero,
                            ano: transformedComunicado.ano,
                            titulo: transformedComunicado.titulo,
                        },
                    },
                    update: transformedComunicado,
                    create: {
                        ...transformedComunicado,
                        criado_em: now,
                        atualizado_em: now,
                    },
                });

                if (result.criado_em.getTime() === result.atualizado_em.getTime()) {
                    newItems.push(result);
                }
            } catch (error) {
                this.logger.error(`Erro ao atualizar comunicados: ${error.message}`);
            }
        }

        return newItems;
    }

    private async syncEndpoint(
        endpoint: () => Promise<any[]>,
        tipo: ComunicadoTipo
    ): Promise<ComunicadoTransfereGov[]> {
        try {
            this.logger.log(`Iniciando sync ${tipo}`);
            const comunicados = await endpoint();
            const newItems = await this.syncComunicados(comunicados, tipo);
            this.logger.log(`Synced ${comunicados.length} ${tipo} comunicados, ${newItems.length} novos itens`);
            return newItems;
        } catch (error) {
            if (error instanceof HttpException) {
                this.logger.error(`HTTP erro syncing ${tipo} comunicados: ${error.getStatus()} - ${error.message}`);
            } else if (error instanceof TransfereGovError) {
                this.logger.error(`TransfereGov erro syncing ${tipo} comunicados: ${error.message}`);
            } else {
                this.logger.error(`Erro: syncing ${tipo} comunicados: ${error.message}`);
            }
            return [];
        }
    }

    @Cron(CronExpression.EVERY_6_HOURS)
    async handleTransfereGovCron() {
        if (process.env['DISABLE_TRANSFERE_GOV_CRONTAB']) return;

        this.logger.log('Iniciando TransfereGOV sync');

        try {
            await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                const locked: { locked: boolean }[] = await prisma.$queryRaw`
                    SELECT pg_try_advisory_xact_lock(${JOB_TRANSFERE_GOV_LOCK}) as locked
                `;
                if (!locked[0].locked) {
                    return;
                }

                await this.syncAllEndpoints();
                await this.criaNotasComunicados();
            });
        } catch (error) {
            this.logger.error(`Erro no sync TransfereGOV: ${error.message}`);
        }
    }

    private async syncAllEndpoints(): Promise<ComunicadoTransfereGov[]> {
        const newItems: ComunicadoTransfereGov[] = [];

        newItems.push(...(await this.syncEndpoint(() => this.transfereGovApi.getGerais(), 'Geral')));
        newItems.push(...(await this.syncEndpoint(() => this.transfereGovApi.getIndividuais(), 'Individual')));
        newItems.push(...(await this.syncEndpoint(() => this.transfereGovApi.getEspeciais(), 'Especial')));
        newItems.push(...(await this.syncEndpoint(() => this.transfereGovApi.getBancada(), 'Bancada')));

        this.logger.log(`Sync TransfereGOV finalizado com sucesso. Novos items: ${newItems.length}`);
        return newItems;
    }

    private async criaNotasComunicados(): Promise<void> {
        const now = new Date();
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const novosItems = await prismaTx.comunicadoTransfereGov.findMany({
                where: {
                    criado_em: {
                        equals: prismaTx.comunicadoTransfereGov.fields.atualizado_em,
                    },
                },
            });
            this.logger.log(`Criando ${novosItems.length} notas`);

            for (const item of novosItems) {
                await this.criaNotificacoesEmailComunicados(prismaTx, item);

                const bloco = await this.blocosService.getTokenFor(
                    { transfere_gov: item.tipo.toString() },
                    { id: CONST_BOT_USER_ID },
                    prismaTx
                );

                await this.notaService.create(
                    {
                        bloco_token: bloco,
                        titulo: item.titulo,
                        nota: item.descricao ?? '',
                        data_nota: DateTime.fromJSDate(item.publicado_em, { zone: 'UTC' })
                            .setZone(SYSTEM_TIMEZONE)
                            .startOf('day')
                            .toJSDate(),
                        status: 'Em_Curso',
                        dados: {
                            transfere_gov_id: item.id,
                            tipo: item.tipo,
                            numero: item.numero,
                            ano: item.ano,
                            link: item.link,
                            publicado_em: DateTime.fromJSDate(item.publicado_em).toISO(),
                        },
                        dispara_email: false,
                        tipo_nota_id: CONST_TIPO_NOTA_TRANSF_GOV,
                        enderecamentos: [],
                        rever_em: null,
                    },
                    { id: CONST_BOT_USER_ID },
                    prismaTx
                );
            }

            // atualiza a data de atualização para evitar que a mesma nota seja criada novamente
            await prismaTx.comunicadoTransfereGov.updateMany({
                where: { id: { in: novosItems.map((item) => item.id) } },
                data: { atualizado_em: now },
            });
        });
    }

    private async criaNotificacoesEmailComunicados(prismaTx: Prisma.TransactionClient, item: ComunicadoTransfereGov) {
        const envioAtivo = await this.smaeConfigService.getConfig('COMUNICADO_EMAIL_ATIVO');
        if (!envioAtivo || envioAtivo !== 'true') return;

        const orgaoConfig = await this.smaeConfigService.getConfig('COMUNICADO_EMAIL_ORGAO_ID');
        const subject = await this.smaeConfigService.getConfig('COMUNICADO_EMAIL_TITULO');
        const orgaoId = orgaoConfig ? parseInt(orgaoConfig, 10) : null;
        if (!orgaoId) throw new Error('Erro ao buscar configuração de órgão para envio de email');
        const recipientes = await this.buscarRecipientesEmailCasaCivil(prismaTx, orgaoId);
        for (const email of recipientes) {
            await prismaTx.emaildbQueue.create({
                data: {
                    id: uuidv7(),
                    to: email,
                    subject: subject || `SMAE - Novo comunicado Transfere GOV: ${item.titulo}`,
                    template: 'comunicado-transfere-gov.html',
                    variables: {
                        titulo: item.titulo,
                        data: Date2YMD.dbDateToDMY(item.publicado_em),
                        descricao: item.descricao,
                        link: new URL([this.baseUrl, 'comunicados-gerais'].join('/')),
                        tipo: item.tipo,
                    },
                    config_id: 1,
                },
            });
        }
    }

    async manualSync(): Promise<ComunicadoTransfereGov[]> {
        this.logger.log('Iniciando sync manual TransfereGOV');
        const newItems = await this.syncAllEndpoints();
        await this.criaNotasComunicados();
        return newItems;
    }

    async listaComunicados(filters: FilterTransfereGovListDto): Promise<PaginatedDto<TransfereGovDto>> {
        const { data_inicio, data_fim } = filters;

        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const dbRows = await this.prisma.comunicadoTransfereGov.findMany({
            where: {
                publicado_em: {
                    gte: data_inicio,
                    lte: data_fim,
                },
            },
            skip: offset,
            take: ipp + 1,
            orderBy: { id: 'desc' },
        });

        const linhas = dbRows.map(
            (item) =>
                ({
                    id: item.id,
                    numero: item.numero,
                    ano: item.ano,
                    titulo: item.titulo,
                    link: item.link,
                    publicado_em: item.publicado_em,
                    descricao: item.descricao,
                    tipo: item.tipo,
                }) satisfies TransfereGovDto
        );

        if (linhas.length > ipp) {
            tem_mais = true;
            linhas.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        return {
            tem_mais: tem_mais,
            token_proxima_pagina: token_proxima_pagina,
            linhas,
            token_ttl: PAGINATION_TOKEN_TTL,
        };
    }

    async manualSyncTransferencias(): Promise<TransfereGovOportunidade[]> {
        this.logger.log('Iniciando sync manual TransfereGOV Transferências');
        const newItems = await this.syncAllEndpointsTransferencias();
        return newItems;
    }

    private transformOportunidade(
        oportunidade: TransfGovTransferencia,
        tipo: TransfereGovOportunidadeTipo
    ): Prisma.TransfereGovOportunidadeCreateInput {
        const hash = this.jsonFlatHash(oportunidade);

        return {
            hash: hash,
            tipo: tipo,
            id_programa: oportunidade.id_programa,
            natureza_juridica_programa: oportunidade.natureza_juridica_programa,
            cod_orgao_sup_programa: oportunidade.cod_orgao_sup_programa,
            desc_orgao_sup_programa: oportunidade.desc_orgao_sup_programa,
            cod_programa: oportunidade.cod_programa,
            nome_programa: oportunidade.nome_programa,
            sit_programa: oportunidade.sit_programa,
            ano_disponibilizacao: oportunidade.ano_disponibilizacao,
            data_disponibilizacao: oportunidade.data_disponibilizacao,
            dt_ini_receb: oportunidade.dt_ini_receb,
            dt_fim_receb: oportunidade.dt_fim_receb,
            modalidade_programa: oportunidade.modalidade_programa,
            acao_orcamentaria: oportunidade.acao_orcamentaria,
        };
    }

    private async syncOportunidades(
        oportunidades: TransfGovTransferencia[],
        tipo: TransfereGovOportunidadeTipo
    ): Promise<TransfereGovOportunidade[]> {
        const newItems: TransfereGovOportunidade[] = [];

        const transferenciasExistentes = await this.prisma.transfereGovOportunidade.findMany({
            select: { hash: true },
        });
        const novasTransferencias: string[] = [];

        const now = new Date();
        for (const oportunidade of oportunidades) {
            const transformedOportunidade = this.transformOportunidade(oportunidade, tipo);

            try {
                const result = await this.prisma.transfereGovOportunidade.upsert({
                    where: {
                        hash: transformedOportunidade.hash,
                    },
                    update: transformedOportunidade,
                    create: {
                        ...transformedOportunidade,
                        criado_em: now,
                        atualizado_em: now,
                    },
                });

                if (!transferenciasExistentes.find((t) => t.hash === transformedOportunidade.hash)) {
                    newItems.push(result);
                    novasTransferencias.push(result.nome_programa);
                }
            } catch (error) {
                this.logger.error(`Erro ao atualizar oportunidades: ${error.message}`);
            }
        }

        if (novasTransferencias.length > 0) {
            await this.criaNotificacoesOportunidades(novasTransferencias);
        }

        return newItems;
    }

    private async criaNotificacoesOportunidades(novasTransferencias: string[]) {
        const envioAtivo = await this.smaeConfigService.getConfig('COMUNICADO_EMAIL_ATIVO');
        if (!envioAtivo || envioAtivo !== 'true') return;

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            // Quando forem adicionadas oportunidades novas de transferência
            // Deve ser enviado um email.
            // "Para: todos os usuários com perfil “Gestor Casa Civil”  e que são do Orgao “SERI”
            const orgaoConfig = await this.smaeConfigService.getConfig('COMUNICADO_EMAIL_ORGAO_ID');
            if (!orgaoConfig) throw new Error('Erro ao buscar configuração de órgão para envio de email');

            const recipientes = await this.buscarRecipientesEmailCasaCivil(prismaTx, parseInt(orgaoConfig, 10));

            for (const oportunidadePrograma of novasTransferencias) {
                for (const recipiente of recipientes) {
                    await prismaTx.emaildbQueue.create({
                        data: {
                            id: uuidv7(),
                            config_id: 1,
                            subject: `SMAE - Nova emenda disponível`,
                            template: 'transferegov-nova-oportunidade.html',
                            to: recipiente,
                            variables: {
                                programa: oportunidadePrograma,
                                link: new URL([this.baseUrl, 'oportunidades'].join('/')),
                            },
                        },
                    });
                }
            }
        });
    }

    private async buscarRecipientesEmailCasaCivil(
        prismaTx: Prisma.TransactionClient,
        orgaoId: number
    ): Promise<string[]> {
        const gestoresCasaCivil = await prismaTx.pessoa.findMany({
            where: {
                desativado: false,
                PessoaPerfil: {
                    some: {
                        perfil_acesso: {
                            nome: CONST_PERFIL_CASA_CIVIL,
                        },
                    },
                },
                pessoa_fisica: {
                    orgao_id: orgaoId,
                },
            },
            select: { email: true },
        });

        const recipientes = [...new Set([...gestoresCasaCivil].map((item) => item.email))];

        return recipientes;
    }

    private async syncOportunidadesEndpoint(
        endpoint: () => Promise<any[]>,
        tipo: TransfereGovOportunidadeTipo
    ): Promise<TransfereGovOportunidade[]> {
        try {
            this.logger.log(`Iniciando sync oportunidades ${tipo}`);
            const oportunidades = await endpoint();
            const newItems = await this.syncOportunidades(oportunidades, tipo);
            this.logger.log(`Synced ${oportunidades.length} ${tipo} oportunidades, ${newItems.length} novos itens`);
            return newItems;
        } catch (error) {
            if (error instanceof HttpException) {
                this.logger.error(`HTTP erro syncing ${tipo} oportunidades: ${error.getStatus()} - ${error.message}`);
            } else if (error instanceof TransfereGovError) {
                this.logger.error(`TransfereGov erro syncing ${tipo} oportunidades: ${error.message}`);
            } else {
                this.logger.error(`Erro: syncing ${tipo} oportunidades: ${error.message}`);
            }
            return [];
        }
    }

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async handleTransfereGovTransferenciasCron() {
        if (process.env['DISABLE_TRANSFERE_GOV_CRONTAB']) return;

        this.logger.log('Iniciando TransfereGOV sync');

        try {
            await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                const locked: { locked: boolean }[] = await prisma.$queryRaw`
                    SELECT pg_try_advisory_xact_lock(${JOB_TRANSFERE_GOV_LOCK}) as locked
                `;
                if (!locked[0].locked) {
                    return;
                }

                await this.syncAllEndpointsTransferencias();
            });
        } catch (error) {
            this.logger.error(`Erro no sync TransfereGOV: ${error.message}`);
        }
    }

    private async syncAllEndpointsTransferencias(): Promise<TransfereGovOportunidade[]> {
        const newItems: TransfereGovOportunidade[] = [];

        // Add oportunidades sync
        newItems.push(
            ...(await this.syncOportunidadesEndpoint(
                () => this.transfereGovApiTransferencias.getEspecificas(),
                'Especifica'
            ))
        );
        newItems.push(
            ...(await this.syncOportunidadesEndpoint(
                () => this.transfereGovApiTransferencias.getVoluntarias(),
                'Voluntaria'
            ))
        );
        newItems.push(
            ...(await this.syncOportunidadesEndpoint(() => this.transfereGovApiTransferencias.getEmendas(), 'Emenda'))
        );

        this.logger.log(`Sync TransfereGOV finalizado com sucesso. Novos items: ${newItems.length}`);
        return newItems;
    }

    async listaTransferencias(
        filters: FilterTransfereGovTransferenciasDto
    ): Promise<PaginatedDto<TransfereGovTransferenciasDto>> {
        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const palavrasChave = await this.buscaIdsPalavraChave(filters.palavras_chave);

        let filterAvaliacao: TransfereGovOportunidadeAvaliacao | null | undefined = undefined;
        if (filters.avaliacao) {
            if (filters.avaliacao === 'NaoSeAplica') {
                filterAvaliacao = TransfereGovOportunidadeAvaliacao.NaoSeAplica;
            } else if (filters.avaliacao === 'Selecionada') {
                filterAvaliacao = TransfereGovOportunidadeAvaliacao.Selecionada;
            } else {
                filterAvaliacao = null;
            }
        }

        const dbRows = await this.prisma.transfereGovOportunidade.findMany({
            where: {
                ano_disponibilizacao: filters.ano,
                tipo: filters.tipo,
                transferencia_incorporada: false,
                avaliacao: filterAvaliacao,
                // Filtro por palavras-chave com tsvector
                id: {
                    in: palavrasChave != undefined ? palavrasChave : undefined,
                },
            },
            skip: offset,
            take: ipp + 1,
            orderBy: { id: 'desc' },
        });

        const linhas = dbRows.map(
            (item) =>
                ({
                    id: item.id,
                    id_programa: item.id_programa,
                    tipo: item.tipo,
                    avaliacao: item.avaliacao,
                    cod_orgao_sup_programa: item.cod_orgao_sup_programa,
                    desc_orgao_sup_programa: item.desc_orgao_sup_programa,
                    cod_programa: item.cod_programa,
                    nome_programa: item.nome_programa,
                    sit_programa: item.sit_programa,
                    ano_disponibilizacao: item.ano_disponibilizacao,
                    data_disponibilizacao: Date2YMD.toString(item.data_disponibilizacao),
                    dt_ini_receb: Date2YMD.toString(item.dt_ini_receb),
                    dt_fim_receb: Date2YMD.toString(item.dt_fim_receb),
                    modalidade_programa: item.modalidade_programa,
                    acao_orcamentaria: item.acao_orcamentaria,
                    natureza_juridica_programa: item.natureza_juridica_programa,
                }) satisfies TransfereGovTransferenciasDto
        );

        if (linhas.length > ipp) {
            tem_mais = true;
            linhas.pop();
            token_proxima_pagina = this.encodeNextPageToken({ ipp: ipp, offset: offset + ipp });
        }

        return {
            tem_mais: tem_mais,
            token_ttl: PAGINATION_TOKEN_TTL,
            token_proxima_pagina: token_proxima_pagina,
            linhas,
        };
    }

    async atualizarTransferencia(id: number, dto: UpdateTransfereGovTransferenciaDto, user: PessoaFromJwt) {
        // TODO: verificar a row.

        return await this.prisma.transfereGovOportunidade.update({
            where: {
                id: id,
            },
            data: {
                avaliacao: dto.avaliacao,
                atualizado_em: new Date(Date.now()),
            },
        });
    }

    private decodeNextPageToken(jwt: string | undefined): NextPageTokenJwtBody | null {
        let tmp: NextPageTokenJwtBody | null = null;
        try {
            if (jwt) tmp = this.jwtService.verify(jwt) as NextPageTokenJwtBody;
        } catch {
            throw new HttpException('Param next_page_token is invalid', 400);
        }
        return tmp;
    }

    private encodeNextPageToken(opt: NextPageTokenJwtBody): string {
        return this.jwtService.sign(opt);
    }

    private jsonFlatHash(obj: any): string {
        const sortedJson = convertToJsonString(obj);
        return crypto.createHash('sha256').update(sortedJson).digest('hex').substring(0, 32);
    }

    async buscaIdsPalavraChave(input: string | undefined): Promise<number[] | undefined> {
        return PrismaHelpers.buscaIdsPalavraChave(this.prisma, 'transfere_gov_oportunidade', input);
    }
}

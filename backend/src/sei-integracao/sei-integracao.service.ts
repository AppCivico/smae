import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { JOB_LISTA_SEI_LOCK } from '../common/dto/locks';
import { PaginatedDto, PAGINATION_TOKEN_TTL } from '../common/dto/paginated.dto';
import { PrismaService } from '../prisma/prisma.service';
import { RetornoRelatorioProcesso, RetornoResumoProcesso, SeiApiService, SeiError } from '../sei-api/sei-api.service';
import {
    FilterSeiListParams,
    FilterSeiParams,
    SeiIntegracaoDto,
    SeiProcessadoDto,
} from './entities/sei-entidade.entity';
import { JwtService } from '@nestjs/jwt';
import { DateTime } from 'luxon';
import { uuidv7 } from 'uuidv7';
import { SmaeConfigService } from '../common/services/smae-config.service';
import { CONST_PERFIL_CASA_CIVIL } from '../common/consts';
const convertToJsonString = require('fast-json-stable-stringify');

class NextPageTokenJwtBody {
    offset: number;
    ipp: number;
}
@Injectable()
export class SeiIntegracaoService {
    private readonly logger = new Logger(SeiIntegracaoService.name);
    baseUrl: string;

    constructor(
        private readonly prisma: PrismaService,
        private readonly sei: SeiApiService,
        private readonly jwtService: JwtService,
        private readonly smaeConfigService: SmaeConfigService
    ) {
        const parsedUrl = new URL(process.env.URL_LOGIN_SMAE || 'http://smae-frontend/');
        this.baseUrl = `${parsedUrl.protocol}//${parsedUrl.hostname}:${parsedUrl.port}`;
    }

    /**
     * Remove não dígitos de uma string.
     */
    private normalizaProcessoSei(str: string): string {
        return str.replace(/\D/g, '');
    }

    private jsonFlatHash(obj: any): string {
        if (!obj) return '';
        try {
            const sortedJson = convertToJsonString(obj);
            return crypto.createHash('sha256').update(sortedJson).digest('hex').substring(0, 32);
        } catch (error) {
            this.logger.error(`Error generating hash: ${error.message}`);
            return '';
        }
    }

    private createProcessado(dados: RetornoRelatorioProcesso | null | undefined): SeiProcessadoDto | null {
        if (!dados || !dados.ultimo_andamento) return null;
        const hasValidDate = dados.ultimo_andamento.data != null;

        if (!hasValidDate) return null;

        return {
            ultimo_andamento_em: dados.ultimo_andamento.data,
            ultimo_andamento_por: {
                nome: dados.ultimo_andamento.usuario?.nome ?? '',
                rf: dados.ultimo_andamento.usuario?.rf ?? '',
            },
            ultimo_andamento_unidade: {
                descricao: dados.ultimo_andamento.unidade?.descricao ?? '',
                id_unidade: dados.ultimo_andamento.unidade?.id_unidade ?? '',
                sigla: dados.ultimo_andamento.unidade?.sigla ?? '',
                tipo_unidade: dados.ultimo_andamento.unidade?.tipo_unidade ?? '',
            },
        };
    }

    async marcaLidoStatusSei(processoSei: string, userId: number, lido: boolean): Promise<void> {
        const normalizedProcessoSei = this.normalizaProcessoSei(processoSei);

        await this.prisma.$transaction(async (prisma) => {
            const statusSei = await prisma.statusSEI.findUnique({
                where: { processo_sei: normalizedProcessoSei },
                select: { usuarios_lidos: true },
            });

            if (!statusSei) {
                throw new Error(`StatusSEI not found for processo_sei: ${normalizedProcessoSei}`);
            }

            let updatedUsuariosLidos: number[];
            if (lido) {
                updatedUsuariosLidos = [...new Set([...statusSei.usuarios_lidos, userId])];
            } else {
                updatedUsuariosLidos = statusSei.usuarios_lidos.filter((id) => id !== userId);
            }

            await prisma.statusSEI.update({
                where: { processo_sei: normalizedProcessoSei },
                data: { usuarios_lidos: updatedUsuariosLidos },
            });
        });
    }

    async verificaStatusLeituraSei(processosSei: string[], userId: number): Promise<Map<string, boolean>> {
        processosSei = processosSei.map(this.normalizaProcessoSei);

        const readStatus = await this.prisma.statusSEI.findMany({
            where: {
                processo_sei: { in: processosSei },
                usuarios_lidos: { has: userId },
            },
            select: {
                processo_sei: true,
            },
        });

        const readStatusMap = new Map<string, boolean>();
        processosSei.forEach((processo) => {
            readStatusMap.set(
                processo,
                readStatus.some((status) => status.processo_sei === processo)
            );
        });

        return readStatusMap;
    }

    async buscaSeiRelatorio(params: FilterSeiParams): Promise<SeiIntegracaoDto> {
        params.processo_sei = this.normalizaProcessoSei(params.processo_sei);

        const now = new Date();
        let statusSei = await this.prisma.statusSEI.findUnique({
            where: { processo_sei: params.processo_sei },
            include: { processosDistribuicaoRecurso: true },
        });

        const needsUpdate =
            !statusSei ||
            !statusSei.relatorio_sincronizado_em ||
            statusSei.sei_hash == '' ||
            statusSei.status_code !== 200 ||
            now.getTime() - statusSei.relatorio_sincronizado_em.getTime() > 60 * 60 * 1000;

        let dados: RetornoRelatorioProcesso | null = null;
        if (needsUpdate) {
            try {
                this.logger.log(`Buscando dados do SEI para ${params.processo_sei}`);
                dados = await this.sei.getRelatorioProcesso(params.processo_sei);

                if (!dados) {
                    throw new Error('Dados do SEI não retornados');
                }

                const newHash = this.jsonFlatHash(dados);

                if (!statusSei) {
                    statusSei = await this.prisma.statusSEI.create({
                        data: {
                            processo_sei: params.processo_sei,
                            link: dados.link || '',
                            status_code: 200,
                            json_resposta: dados as any,
                            sei_hash: newHash,
                            resumo_hash: '',
                            ativo: false,
                            sei_atualizado_em: null,
                            relatorio_sincronizado_em: now,
                            proxima_sincronizacao: this.calculaProximaSync(),
                            usuarios_lidos: [],
                        },
                        include: { processosDistribuicaoRecurso: true },
                    });
                } else {
                    const updateData: Prisma.StatusSEIUpdateInput = {
                        relatorio_sincronizado_em: now,
                        link: dados.link || '',
                        status_code: 200,
                        proxima_sincronizacao: this.calculaProximaSync(),
                    };

                    if (statusSei.sei_hash !== newHash) {
                        updateData.sei_atualizado_em = now;
                        updateData.json_resposta = JSON.stringify(dados);
                        updateData.sei_hash = newHash;
                        updateData.usuarios_lidos = []; // mudou o hash, então reset a lista de usuários que leram

                        // Enviando email de notificação para gestores da Casa Civil
                        if (
                            statusSei.processosDistribuicaoRecurso?.length > 0 &&
                            statusSei.sei_hash !== '' &&
                            statusSei.resumo_hash !== ''
                        ) {
                            // Verificando hashes, pois caso ambas vazias, foi criado pelo endpoint de sync de distribuições.
                            // Logo, não é necessário enviar email de notificação deste primeiro sync.
                            await this.enviarEmailNotificacaoSEI(
                                params.processo_sei,
                                statusSei.processosDistribuicaoRecurso[0].id
                            );
                        }
                    }

                    statusSei = await this.prisma.statusSEI.update({
                        where: { id: statusSei.id },
                        data: updateData,
                        // TODO: tratar para não ser necessário chamar o include aqui. Problema de tipagem.
                        include: { processosDistribuicaoRecurso: true },
                    });
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
                throw new SeiError(`Erro ao processar dados do SEI: ${errorMessage}`);
            }
        } else {
            dados = statusSei?.json_resposta?.valueOf() as RetornoRelatorioProcesso;
        }

        if (!dados || !statusSei) {
            throw new Error('Erro ao salvar ou recuperar dados do SEI no banco de dados');
        }

        const processado = this.createProcessado(dados);

        return {
            id: statusSei.id,
            ativo: statusSei.ativo,
            link: dados.link || '',
            resumo_sincronizado_em: statusSei.resumo_sincronizado_em,
            resumo_status_code: statusSei.resumo_status_code,
            relatorio_sincronizado_em: statusSei.relatorio_sincronizado_em,
            json_resposta: dados,
            processado: processado,
            processo_sei: dados.numero_processo || params.processo_sei,
            resumo_atualizado_em: statusSei.resumo_atualizado_em,
            sei_atualizado_em: statusSei.sei_atualizado_em,
            status_code: statusSei.status_code,
        };
    }

    async buscaSeiResumo(params: FilterSeiParams): Promise<SeiIntegracaoDto> {
        params.processo_sei = this.normalizaProcessoSei(params.processo_sei);

        const now = new Date();
        let statusSei = await this.prisma.statusSEI.findUnique({
            where: { processo_sei: params.processo_sei },
        });

        const needsUpdate =
            !statusSei ||
            !statusSei.resumo_atualizado_em ||
            statusSei.resumo_hash == '' ||
            statusSei.resumo_status_code !== 200 ||
            now.getTime() - statusSei.resumo_atualizado_em.getTime() > 60 * 60 * 1000; // 1 hour

        let dadosResumo;
        if (needsUpdate) {
            this.logger.log(`Buscando dados do resumo SEI para ${params.processo_sei}`);
            dadosResumo = await this.sei.getResumoProcesso(params.processo_sei);
            const newHash = this.jsonFlatHash(dadosResumo);

            if (!statusSei) {
                statusSei = await this.prisma.statusSEI.create({
                    data: {
                        processo_sei: params.processo_sei,
                        link: dadosResumo.link,
                        status_code: 0,
                        sei_hash: '',
                        resumo_hash: newHash,
                        resumo_json_resposta: dadosResumo as any,
                        resumo_status_code: 200,
                        ativo: false,
                        resumo_atualizado_em: null,
                        resumo_sincronizado_em: now,
                        proxima_sincronizacao: this.calculaProximaSync(),
                    },
                });
            } else {
                const updateData: Prisma.StatusSEIUpdateInput = {
                    resumo_sincronizado_em: now,
                    link: dadosResumo.link,
                    resumo_status_code: 200,
                    proxima_sincronizacao: this.calculaProximaSync(),
                };

                if (statusSei.resumo_hash !== newHash) {
                    updateData.resumo_atualizado_em = now;
                    updateData.resumo_hash = newHash;
                }

                statusSei = await this.prisma.statusSEI.update({
                    where: { id: statusSei.id },
                    data: updateData,
                });
            }
        } else {
            dadosResumo = statusSei?.resumo_json_resposta?.valueOf() as any as RetornoResumoProcesso;
        }
        if (!dadosResumo || !statusSei) throw new Error('Erro ao salvar dados do SEI no banco de dados');

        return {
            id: statusSei.id,
            ativo: statusSei.ativo,
            relatorio_sincronizado_em: statusSei.relatorio_sincronizado_em,
            resumo_sincronizado_em: statusSei.resumo_sincronizado_em,
            resumo_status_code: statusSei.resumo_status_code,
            resumo_json_resposta: dadosResumo,
            processado: null,
            processo_sei: dadosResumo.numero_processo,
            resumo_atualizado_em: statusSei.resumo_atualizado_em,
            sei_atualizado_em: statusSei.sei_atualizado_em,
            status_code: statusSei.status_code,
            link: dadosResumo.link,
        };
    }

    private calculaProximaSync(): Date {
        const now = DateTime.now();
        let next5AM = now.set({ hour: 5, minute: 0, second: 0, millisecond: 0 });

        // Se já passou das 5 da manhã, defina para 5 da manhã do dia seguinte
        if (now > next5AM) {
            next5AM = next5AM.plus({ days: 1 });
        }

        // Se estivermos a menos de 1 hora das próximas 5 da manhã, adicione mais um dia
        if (next5AM.diff(now, 'hours').hours < 1) {
            next5AM = next5AM.plus({ days: 1 });
        }

        return next5AM.toJSDate();
    }

    async buscaSeiStatus(processos: string[]): Promise<SeiIntegracaoDto[]> {
        const normalizedProcessos = processos.map(this.normalizaProcessoSei);

        const statusSeiDb = await this.prisma.statusSEI.findMany({
            where: { processo_sei: { in: normalizedProcessos } },
        });

        return statusSeiDb.map((statusSei) => {
            const dados = statusSei.json_resposta?.valueOf() as any as RetornoRelatorioProcesso;

            const processado = this.createProcessado(dados);

            return {
                id: statusSei.id,
                ativo: statusSei.ativo,
                relatorio_sincronizado_em: statusSei.relatorio_sincronizado_em,
                resumo_sincronizado_em: statusSei.resumo_sincronizado_em,
                resumo_status_code: statusSei.resumo_status_code,
                json_resposta: dados,
                resumo_json_resposta: statusSei.resumo_json_resposta?.valueOf() as any,
                processado: processado,
                processo_sei: statusSei.processo_sei,
                resumo_atualizado_em: statusSei.resumo_atualizado_em ?? new Date(),
                sei_atualizado_em: statusSei.sei_atualizado_em ?? new Date(),
                status_code: statusSei.status_code,
                link: statusSei.link,
            } satisfies SeiIntegracaoDto;
        });
    }

    async atualizaStatusAtivo(processos: string[], ativo: boolean): Promise<void> {
        const normalizedProcessos = processos.map(this.normalizaProcessoSei);

        for (const processo of normalizedProcessos) {
            if (!ativo) continue;

            // pelo menos uma vez, atualiza o status do processo já que no momento não temos um trigger na web
            const exists = await this.prisma.statusSEI.count({
                where: { processo_sei: processo },
            });

            if (!exists) {
                try {
                    await this.buscaSeiRelatorio({ processo_sei: processo });
                } catch (error) {
                    this.logger.error(`Erro ao buscar SEI ${processo}: ${error?.message}`);
                }
            }
        }

        await this.prisma.statusSEI.updateMany({
            where: {
                processo_sei: {
                    in: normalizedProcessos,
                },
                NOT: {
                    ativo: ativo,
                },
            },
            data: { ativo: ativo },
        });
    }

    @Cron(process.env['SEI_CRONTAB_STRING'] || '*/5 * * * *')
    async handleListaSeiCron() {
        if (process.env['DISABLE_SEI_CRONTAB'] || process.env['DISABLED_CRONTABS'] == 'all') return;

        this.logger.log('Iniciando Sync SEI');

        try {
            await this.prisma.$transaction(async (prisma: Prisma.TransactionClient) => {
                const locked: {
                    locked: boolean;
                }[] = await prisma.$queryRaw`SELECT pg_try_advisory_xact_lock(${JOB_LISTA_SEI_LOCK}) as locked
            `;
                if (!locked[0].locked) {
                    return;
                }

                await this.syncSEIRecords();
            });
        } catch (error) {
            this.logger.error(`Erro ao buscar SEIs para atualizar: ${error.message}`);
        }
    }

    private async syncSEIRecords() {
        // meu mercúrio esta retrógrado, nao consigo adicionar paginação sem o prisma ficar maluco
        // fica pra proxima...
        const activeRecords = await this.prisma.statusSEI.findMany({
            where: {
                ativo: true,
                relatorio_sincronizado_em: {
                    lte: new Date(new Date().getTime() - 60 * 60 * 1000),
                },
                proxima_sincronizacao: {
                    lte: new Date(),
                },
            },
            orderBy: { relatorio_sincronizado_em: 'asc' },
            select: { processo_sei: true, id: true },
            take: 1000,
        });

        for (const record of activeRecords) {
            try {
                await this.buscaSeiRelatorio({ processo_sei: record.processo_sei });
            } catch (error) {
                const updateData: Prisma.StatusSEIUpdateInput = {
                    status_code: 500,
                    sincronizacao_errmsg: 'message' in error ? error.message : 'Erro desconhecido: ' + error.toString(),
                    proxima_sincronizacao: this.calculaProximaSync(),
                };

                if (error instanceof HttpException) {
                    updateData.status_code = error.getStatus();
                    updateData.sincronizacao_errmsg = error.getResponse();
                } else if (error instanceof SeiError) {
                    updateData.status_code = 500;
                    updateData.sincronizacao_errmsg = error.message;
                }

                await this.prisma.statusSEI.update({
                    where: { id: record.id },
                    data: updateData,
                });

                this.logger.error(
                    `Erro ao atualizar SEI ${record.processo_sei}: ${error.message} // ${updateData.sincronizacao_errmsg}`
                );
            }
        }

        this.logger.log('Fim do Sync do SEI');
    }

    async syncDistribuicaoRecursoSEI() {
        // Esta função busca todos os registros (nro SEI) de distribuição de recurso que estão ativos e não possuem status SEI.
        const activeRecords = await this.prisma.distribuicaoRecursoSei.findMany({
            where: {
                removido_em: null,
                status_sei_id: null,
                distribuicao_recurso: {
                    removido_em: null,
                    transferencia: {
                        removido_em: null,
                    },
                },
            },
            select: {
                id: true,
                processo_sei: true,
            },
        });

        const operations = [];
        for (const record of activeRecords) {
            const processoSei = this.normalizaProcessoSei(record.processo_sei);

            // Caso o registro já exista na table de status SEI, não é necessário criar um novo registro.
            const rowExistente = await this.prisma.statusSEI.findFirst({
                where: { processo_sei: processoSei },
                select: { id: true },
            });

            operations.push(
                this.prisma.distribuicaoRecursoSei.update({
                    where: { id: record.id },
                    data: {
                        status_sei: rowExistente
                            ? { connect: { id: rowExistente.id } }
                            : {
                                  create: {
                                      processo_sei: processoSei,
                                      link: '',
                                      sei_hash: '',
                                      resumo_hash: '',
                                      ativo: true,
                                      proxima_sincronizacao: this.calculaProximaSync(),
                                  },
                              },
                    },
                })
            );
        }

        await Promise.all(operations);
    }

    async listaProcessos(filters: FilterSeiListParams): Promise<PaginatedDto<SeiIntegracaoDto>> {
        const { relatorio_sincronizado_de: data_inicio, relatorio_sincronizado_ate: data_fim } = filters;

        let tem_mais = false;
        let token_proxima_pagina: string | null = null;

        let ipp = filters.ipp ? filters.ipp : 25;
        let offset = 0;
        const decodedPageToken = this.decodeNextPageToken(filters.token_proxima_pagina);

        if (decodedPageToken) {
            offset = decodedPageToken.offset;
            ipp = decodedPageToken.ipp;
        }

        const dbRows = await this.prisma.statusSEI.findMany({
            where: {
                relatorio_sincronizado_em: {
                    gte: data_inicio,
                    lte: data_fim,
                },
            },
            skip: offset,
            take: ipp + 1,
            orderBy: { relatorio_sincronizado_em: 'desc' },
        });

        const linhas: SeiIntegracaoDto[] = dbRows.map((item) => ({
            id: item.id,
            processo_sei: item.processo_sei,
            ativo: item.ativo,
            link: item.link,
            relatorio_sincronizado_em: item.relatorio_sincronizado_em,
            resumo_sincronizado_em: item.resumo_sincronizado_em,
            resumo_status_code: item.resumo_status_code,
            sei_atualizado_em: item.sei_atualizado_em,
            resumo_atualizado_em: item.resumo_atualizado_em,
            status_code: item.status_code,
            json_resposta: item.json_resposta,
            resumo_json_resposta: item.resumo_json_resposta,
            processado: this.createProcessado(item.json_resposta?.valueOf() as RetornoRelatorioProcesso),
        }));

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

    private async enviarEmailNotificacaoSEI(processo: string, distribuicao_recurso_id: number) {
        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const distribuicaoRecurso = await prismaTx.distribuicaoRecurso.findFirst({
                where: {
                    id: distribuicao_recurso_id,
                    removido_em: null,
                },
                select: {
                    transferencia: {
                        select: { id: true },
                    },
                },
            });

            if (!distribuicaoRecurso) {
                this.logger.log(
                    `Processo SEI (${processo}) não possui distribuição de recurso atrelada, portanto não será enviado e-mail notificando mudança.`
                );
                return;
            }

            const orgaoConfig = await this.smaeConfigService.getConfig('COMUNICADO_EMAIL_ORGAO_ID');
            const orgaoId = orgaoConfig ? parseInt(orgaoConfig, 10) : null;

            const gestores = await prismaTx.pessoa.findMany({
                where: {
                    desativado: false,
                    PessoaPerfil: {
                        some: {
                            perfil_acesso: {
                                nome: CONST_PERFIL_CASA_CIVIL,
                            },
                        },
                    },
                    pessoa_fisica: orgaoId
                        ? {
                              orgao_id: orgaoId,
                          }
                        : undefined,
                },
                select: { email: true },
            });

            for (const gestor of gestores) {
                await prismaTx.emaildbQueue.create({
                    data: {
                        id: uuidv7(),
                        config_id: 1,
                        subject: `SMAE - Alteração no processo SEI ${processo}`,
                        template: 'processo-sei-atualizacao.html',
                        to: gestor.email,
                        variables: {
                            numero_processo: processo,
                            link: new URL(
                                [
                                    this.baseUrl,
                                    'transferencias-voluntarias',
                                    distribuicaoRecurso.transferencia.id,
                                    'detalhes',
                                ].join('/')
                            ),
                        },
                    },
                });
            }
        });
    }
}

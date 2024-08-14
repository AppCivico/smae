import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import * as crypto from 'crypto';
import { JOB_LISTA_SEI_LOCK } from '../common/dto/locks';
import { PrismaService } from '../prisma/prisma.service';
import { RetornoRelatorioProcesso, RetornoResumoProcesso, SeiApiService } from '../sei-api/sof-api.service';
import { FilterSeiParams, SeiIntegracaoDto, SeiProcessadoDto } from './entities/sei-entidade.entity';
const convertToJsonString = require('fast-json-stable-stringify');

@Injectable()
export class SeiIntegracaoService {
    private readonly logger = new Logger(SeiIntegracaoService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly sei: SeiApiService
    ) {}

    /**
     * Remove não dígitos de uma string.
     */
    private normalizaProcessoSei(str: string): string {
        return str.replace(/\D/g, '');
    }

    private jsonFlatHash(obj: any): string {
        const sortedJson = convertToJsonString(obj);
        return crypto.createHash('sha256').update(sortedJson).digest('hex').substring(0, 32);
    }

    private createProcessado(dados: RetornoRelatorioProcesso): SeiProcessadoDto | null {
        if (!dados || !dados.ultimo_andamento) return null;

        return {
            ultimo_andamento_em: dados.ultimo_andamento.data,
            ultimo_andamento_por: {
                nome: dados.ultimo_andamento.usuario.nome,
                rf: dados.ultimo_andamento.usuario.rf,
            },
            ultimo_andamento_unidade: {
                descricao: dados.ultimo_andamento.unidade.descricao,
                id_unidade: dados.ultimo_andamento.unidade.id_unidade,
                sigla: dados.ultimo_andamento.unidade.sigla,
                tipo_unidade: dados.ultimo_andamento.unidade.tipo_unidade,
            },
        };
    }

    async buscaSeiRelatorio(params: FilterSeiParams): Promise<SeiIntegracaoDto> {
        params.processo_sei = this.normalizaProcessoSei(params.processo_sei);

        const now = new Date();
        let statusSei = await this.prisma.statusSEI.findUnique({
            where: { processo_sei: params.processo_sei },
        });

        const needsUpdate =
            !statusSei ||
            !statusSei.atualizado_em ||
            now.getTime() - statusSei.atualizado_em.getTime() > 60 * 60 * 1000; // 1 hour

        let dados;
        if (needsUpdate) {
            this.logger.log(`Buscando dados do SEI para ${params.processo_sei}`);
            dados = await this.sei.getRelatorioProcesso(params.processo_sei);
            const newHash = this.jsonFlatHash(dados);

            if (!statusSei) {
                statusSei = await this.prisma.statusSEI.create({
                    data: {
                        processo_sei: params.processo_sei,
                        link: dados.link,
                        status_code: 200,
                        json_resposta: dados as any,
                        sei_hash: newHash,
                        resumo_hash: '',
                        ativo: false, // não é ativo por padrão
                        sei_atualizado_em: now,
                        atualizado_em: now,
                    },
                });
            } else {
                const updateData: any = {
                    atualizado_em: now,
                    link: dados.link,
                    status_code: 200,
                };

                if (statusSei.sei_hash !== newHash) {
                    updateData.sei_atualizado_em = now;
                    updateData.json_resposta = JSON.stringify(dados);
                    updateData.sei_hash = newHash;
                }

                this.logger.verbose(`Atualizando dados do SEI para ${params.processo_sei}`);
                statusSei = await this.prisma.statusSEI.update({
                    where: { id: statusSei.id },
                    data: updateData,
                });
            }
        } else {
            console.log(statusSei);

            dados = statusSei?.json_resposta?.valueOf() as any as RetornoRelatorioProcesso;
        }
        if (!dados || !statusSei) throw new Error('Erro ao salvar dados do SEI no banco de dados');

        const processado = this.createProcessado(dados);

        return {
            id: statusSei.id,
            ativo: statusSei.ativo,
            atualizado_em: statusSei.atualizado_em ?? new Date(),
            json_resposta: dados,
            processado: processado,
            processo_sei: dados.numero_processo,
            resumo_atualizado_em: statusSei.resumo_atualizado_em ?? new Date(),
            sei_atualizado_em: statusSei.sei_atualizado_em ?? new Date(),
            status_code: statusSei.status_code,
            link: dados.link,
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
            !statusSei.atualizado_em ||
            now.getTime() - statusSei.atualizado_em.getTime() > 60 * 60 * 1000; // 1 hour

        let dadosResumo;
        if (needsUpdate) {
            this.logger.log(`Buscando dados do SEI para ${params.processo_sei}`);
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
                        resumo_atualizado_em: now,
                        atualizado_em: now,
                    },
                });
            } else {
                const updateData: any = {
                    atualizado_em: now,
                    url: dadosResumo.link,
                    status_code: 200,
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
            atualizado_em: statusSei.atualizado_em ?? new Date(),
            resumo_json_resposta: dadosResumo,
            processado: null,
            processo_sei: dadosResumo.numero_processo,
            resumo_atualizado_em: statusSei.resumo_atualizado_em ?? new Date(),
            sei_atualizado_em: statusSei.sei_atualizado_em ?? new Date(),
            status_code: statusSei.status_code,
            link: dadosResumo.link,
        };
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
                atualizado_em: statusSei.atualizado_em ?? new Date(),
                json_resposta: dados,
                processado: processado,
                processo_sei: statusSei.processo_sei,
                resumo_atualizado_em: statusSei.resumo_atualizado_em ?? new Date(),
                sei_atualizado_em: statusSei.sei_atualizado_em ?? new Date(),
                status_code: statusSei.status_code,
                link: statusSei.link,
            };
        });
    }

    async atualizaStatusAtivo(processos: string[], ativo: boolean): Promise<void> {
        const normalizedProcessos = processos.map(this.normalizaProcessoSei);

        await this.prisma.statusSEI.updateMany({
            where: {
                processo_sei: {
                    in: normalizedProcessos,
                },
            },
            data: {
                ativo: ativo,
                atualizado_em: new Date(),
            },
        });
    }

    @Cron(process.env['SEI_CRONTAB_STRING'] || '*/5 * * * *')
    async handleListaSeiCron() {
        if (process.env['DISABLE_SEI_CRONTAB']) return;

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
                atualizado_em: {
                    lte: new Date(new Date().getTime() - 60 * 60 * 1000),
                },
            },
            orderBy: { atualizado_em: 'asc' },
            select: { processo_sei: true },
        });

        for (const record of activeRecords) {
            try {
                await this.buscaSeiRelatorio({ processo_sei: record.processo_sei });

                this.logger.log(`Atualizou SEI record: ${record.processo_sei}`);
            } catch (error) {
                this.logger.error(`Erro ao atualizar SEI ${record.processo_sei}: ${error.message}`);
            }
        }

        this.logger.log('Fim do Sync do SEI');
    }
}

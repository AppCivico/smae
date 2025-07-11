import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { SYSTEM_TIMEZONE } from 'src/common/date2ymd';
import { JOB_DOTACAO_SOF_LOCK } from 'src/common/dto/locks';
import { RetryPromise } from 'src/common/retryPromise';
import { SmaeConfigService } from 'src/common/services/smae-config.service';
import { SofApiService } from 'src/sof-api/sof-api.service';
import { IsCrontabDisabled } from '../common/crontab-utils';
import { PrismaService } from '../prisma/prisma.service';
import { DotacaoProcessoNotaService } from './dotacao-processo-nota.service';
import { DotacaoProcessoService } from './dotacao-processo.service';
import { DotacaoService } from './dotacao.service';

@Injectable()
export class DotacaoCrontabService {
    private readonly logger = new Logger(DotacaoCrontabService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly sof: SofApiService,
        private readonly dotacao: DotacaoService,
        private readonly dotacaoProcessoService: DotacaoProcessoService,
        private readonly dotacaoProcessoNotaService: DotacaoProcessoNotaService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    // durante todos os minutos da madrugada, vai ficar tentando
    // buscar o lock e tbm a lista de dotações que faltam atualizar
    @Cron('* 3-8 * * *')
    async handleDotacaoCron() {
        if (IsCrontabDisabled('dotacao')) return;

        await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient) => {
                const locked: {
                    locked: boolean;
                    ano_corrente: number;
                }[] = await prisma.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_DOTACAO_SOF_LOCK}) as locked,
                extract('year' from (now() at time zone ${SYSTEM_TIMEZONE}::varchar))::int as ano_corrente
            `;
                if (!locked[0].locked) {
                    return;
                }

                await this.atualizaDotacoes(locked[0].ano_corrente);
            },
            {
                maxWait: 30000,
                // cada lock pode durar 1 hr
                timeout: 60 * 1000 * 60,
                isolationLevel: 'Serializable',
            }
        );
    }

    async atualizaDotacoes(ano_corrente: number) {
        const simultaneidade = await this.smaeConfigService.getConfigNumberWithDefault(
            'DOTACAO_SOF_SIMULTANEIDADE',
            16
        );
        // como não tem usar o date-trunc no sincronizado_em, vou usar 20h no lugar de 24h
        const ontem = DateTime.now().minus({ hour: 20 }).toJSDate();

        {
            const mesMaisAtual = this.sof.mesMaisRecenteDoAno(ano_corrente, 'realizado');
            // realizado
            const dotacaoRealizadoAtualizar = await this.prisma.dotacaoRealizado.findMany({
                where: {
                    sincronizado_em: { lte: ontem },
                    ano_referencia: ano_corrente,
                },
                take: 1000,
                orderBy: [{ sincronizado_em: 'asc' }],
            });

            const dotacaoRealizadoLength = dotacaoRealizadoAtualizar.length;
            if (dotacaoRealizadoLength > 0) this.logger.log(`Atualizando ${dotacaoRealizadoLength} dotações realizado`);

            for (let i = 0; i < dotacaoRealizadoLength; i += simultaneidade) {
                const promises = dotacaoRealizadoAtualizar.slice(i, i + simultaneidade).map((dotacao) => {
                    return RetryPromise(() =>
                        this.dotacao.sincronizarDotacaoRealizado(
                            {
                                ano: dotacao.ano_referencia,
                                dotacao: dotacao.dotacao,
                                pdm_id: undefined,
                                portfolio_id: undefined,
                            },
                            mesMaisAtual
                        )
                    );
                });

                await Promise.all(promises);
            }
        }

        {
            // processos
            const dotacaoProcessoAtualizar = await this.prisma.dotacaoProcesso.findMany({
                where: {
                    sincronizado_em: { lte: ontem },
                    ano_referencia: ano_corrente,
                },
                take: 1000,
                orderBy: [{ sincronizado_em: 'asc' }],
            });

            const dotacaoProcessoLength = dotacaoProcessoAtualizar.length;
            if (dotacaoProcessoLength > 0)
                this.logger.log(`Atualizando ${dotacaoProcessoLength} dotações-processo realizado`);

            for (let i = 0; i < dotacaoProcessoLength; i += simultaneidade) {
                const promises = dotacaoProcessoAtualizar.slice(i, i + simultaneidade).map((dotacao) => {
                    return RetryPromise(() =>
                        this.dotacaoProcessoService.valorRealizadoProcesso({
                            ano: dotacao.ano_referencia,
                            processo: dotacao.dotacao_processo,
                            pdm_id: undefined,
                            portfolio_id: undefined,
                        })
                    );
                });

                await Promise.all(promises);
            }
        }

        {
            // notas
            const dotacaoNotasAtualizar = await this.prisma.dotacaoProcessoNota.findMany({
                where: {
                    sincronizado_em: { lte: ontem },
                    ano_referencia: ano_corrente,
                },
                take: 1000,
                orderBy: [{ sincronizado_em: 'asc' }],
            });

            const dotacaoNotasLength = dotacaoNotasAtualizar.length;
            if (dotacaoNotasLength > 0) this.logger.log(`Atualizando ${dotacaoNotasLength} dotações-notas realizado`);

            for (let i = 0; i < dotacaoNotasLength; i += simultaneidade) {
                const promises = dotacaoNotasAtualizar.slice(i, i + simultaneidade).map((dotacao) => {
                    return RetryPromise(() =>
                        this.dotacaoProcessoNotaService.valorRealizadoNotaEmpenho({
                            ano: dotacao.ano_referencia,
                            nota_empenho: dotacao.dotacao_processo_nota,
                            pdm_id: undefined,
                            portfolio_id: undefined,
                        })
                    );
                });

                await Promise.all(promises);
            }
        }

        {
            const mesMaisAtual = this.sof.mesMaisRecenteDoAno(ano_corrente, 'planejado');
            // planejado
            const dotacaoPlanejadoAtualizar = await this.prisma.dotacaoPlanejado.findMany({
                where: {
                    sincronizado_em: { lte: ontem },
                    ano_referencia: ano_corrente,
                },
                take: 1000,
                orderBy: [{ sincronizado_em: 'asc' }],
            });

            const dotacaoPlanLength = dotacaoPlanejadoAtualizar.length;
            if (dotacaoPlanLength > 0) this.logger.log(`Atualizando ${dotacaoPlanLength} dotações planejado`);

            for (let i = 0; i < dotacaoPlanLength; i += simultaneidade) {
                const promises = dotacaoPlanejadoAtualizar.slice(i, i + simultaneidade).map((dotacao) => {
                    return RetryPromise(() =>
                        this.dotacao.sincronizarDotacaoPlanejado(
                            {
                                ano: dotacao.ano_referencia,
                                dotacao: dotacao.dotacao,
                                pdm_id: undefined,
                                portfolio_id: undefined,
                            },
                            mesMaisAtual
                        )
                    );
                });

                await Promise.all(promises);
            }
        }
    }
}

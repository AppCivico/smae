import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SeiApiService } from '../sei-api/sof-api.service';
import { FilterSeiParams, SeiIntegracaoDto, SeiProcessadoDto } from './entities/sei-entidade.entity';

@Injectable()
export class SeiIntegracaoService {
    private readonly logger = new Logger(SeiIntegracaoService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly sei: SeiApiService
    ) {}

    async buscaSeiResumo(params: FilterSeiParams): Promise<SeiIntegracaoDto> {
        const dados = await this.sei.getResumoProcesso(params.processo_sei);

        return {
            ativo: false,
            atualizado_em: new Date(Date.now()),
            json_resposta: dados,
            processado: null,
            processo_sei: dados.numero_processo,
            resumo_atualizado_em: new Date(Date.now()),
            sei_atualizado_em: new Date(Date.now()),
            status_code: 200,
            link: dados.link,
        };
    }

    async buscaSeiRelatorio(params: FilterSeiParams): Promise<SeiIntegracaoDto> {
        const dados = await this.sei.getRelatorioProcesso(params.processo_sei);

        const processado: SeiProcessadoDto = {
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
        return {
            ativo: false,
            atualizado_em: new Date(Date.now()),
            json_resposta: dados,
            processado: processado,
            processo_sei: dados.numero_processo,
            resumo_atualizado_em: new Date(Date.now()),
            sei_atualizado_em: new Date(Date.now()),
            status_code: 200,
            link: dados.link,
        };
    }

    async buscaSeiStatus(_processos: string[]): Promise<SeiIntegracaoDto[]> {
        return [];
    }

    //
    //    @Cron(process.env['SOF_CRONTAB_STRING'] || '*/5 * * * *')
    //    async handleListaSofCron() {
    //        if (process.env['DISABLE_SOF_CRONTAB']) return;
    //
    //        await this.prisma.$transaction(
    //            async (prisma: Prisma.TransactionClient) => {
    //                const jobs: {
    //                    ano: number;
    //                }[] = await prisma.$queryRaw`
    //                select ano
    //                from (
    //                    select extract('year' from dt)::int as ano,
    //                    case when dt.dt > now() - '1 year'::interval then
    //                        se.ano is null or now() - se.atualizado_em > '24 hours'::interval
    //                    else
    //                        se.ano is null or false
    //                    end as needs_update
    //                    from generate_series('2003-01-01', (select now()), '1 year') dt
    //                    left join sof_entidade se on se.ano = extract('year' from dt.dt)::int
    //                ) x
    //                where needs_update
    //                ORDER BY 1 DESC LIMIT 2;
    //            `;
    //                if (jobs.length == 0) return;
    //
    //                const locked: {
    //                    locked: boolean;
    //                    now_ymd: DateYMD;
    //                }[] = await prisma.$queryRaw`SELECT
    //                pg_try_advisory_xact_lock(${JOB_LISTA_SOF_LOCK}) as locked,
    //                (now() at time zone ${SYSTEM_TIMEZONE}::varchar)::date::text as now_ymd
    //            `;
    //                if (!locked[0].locked) {
    //                    return;
    //                }
    //
    //                // não passa a TX, ou seja, ele que seja responsável por sua própria $transaction
    //                for (const job of jobs) {
    //                    await this.atualizaListasSof(job.ano);
    //                }
    //            },
    //            {
    //                maxWait: 30000,
    //                timeout: 60 * 1000 * 15,
    //                isolationLevel: 'Serializable',
    //            }
    //        );
    //    }

    //    async atualizaListasSof(ano: number) {
    //        ano = Number(ano);
    //        const before = Date.now();
    //        this.logger.log(`Atualizando SOF -- ${ano}`);
    //        const data = await this.sei.entidades(ano);
    //        await this.prisma.sofEntidade.upsert({
    //            where: { ano: ano },
    //            create: {
    //                ano: ano,
    //                atualizado_em: new Date(Date.now()),
    //                dados: data,
    //            },
    //            update: {
    //                atualizado_em: new Date(Date.now()),
    //                dados: data,
    //            },
    //        });
    //        this.logger.log(
    //            `Atualização SOF concluída em ${Math.round(
    //                (Date.now() - before) / 1000
    //            )} segundos, atualizando MV sof_entidades_linhas`
    //        );
    //
    //        try {
    //            await this.prisma.$queryRaw`refresh materialized view sof_entidades_linhas;`;
    //            this.logger.log(`MV sof_entidades_linhas atualizada com sucesso.`);
    //        } catch (error) {
    //            const errmsg = `Erro ao atualizar materialized view sof_entidades_linhas após atualização deste ano: ${error.toString()}`;
    //            this.logger.error(errmsg);
    //
    //            await this.prisma.sofEntidade.updateMany({
    //                where: { ano: ano },
    //                data: {
    //                    errmsg: errmsg,
    //                },
    //            });
    //            console.log(error);
    //        }
    //    }
}

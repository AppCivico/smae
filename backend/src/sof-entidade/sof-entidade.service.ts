import { HttpException, Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { Prisma } from '@prisma/client';
import { Date2YMD, DateYMD, SYSTEM_TIMEZONE } from '../common/date2ymd';
import { PrismaService } from '../prisma/prisma.service';
import { SofApiService } from '../sof-api/sof-api.service';
const JOB_LOCK_NUMBER = 65656564;

@Injectable()
export class SofEntidadeService {
    private readonly logger = new Logger(SofEntidadeService.name);
    constructor(private readonly prisma: PrismaService, private readonly sof: SofApiService) {}

    async findByYear(ano: number) {
        const dados = await this.prisma.sofEntidade.findFirst({ where: { ano: ano } });
        if (!dados) throw new HttpException(`Não há dados para ${ano}`, 400);

        return {
            atualizado_em: Date2YMD.toString(dados.atualizado_em),
            dados: dados.dados,
        };
    }

    @Cron('5 0 * * * *')
    async handleCron() {
        if (Boolean(process.env['DISABLE_SOF_CRONTAB'])) return;

        await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient) => {
                const jobs: {
                    ano: number;
                }[] = await prisma.$queryRaw`
                select ano
                from (
                    select extract('year' from dt)::int as ano,
                    case when dt.dt > now() - '1 year'::interval then
                        se.ano is null or now() - se.atualizado_em > '24 hours'::interval
                    else
                        se.ano is null or false
                    end as needs_update
                    from generate_series('2003-01-01', (select now()), '1 year') dt
                    left join sof_entidade se on se.ano = extract('year' from dt.dt)::int
                ) x
                where needs_update
                ORDER BY 1 DESC LIMIT 2;
            `;
                if (jobs.length == 0) return;

                const locked: {
                    locked: boolean;
                    now_ymd: DateYMD;
                }[] = await prisma.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_LOCK_NUMBER}) as locked,
                (now() at time zone ${SYSTEM_TIMEZONE}::varchar)::date::text as now_ymd
            `;
                if (!locked[0].locked) {
                    return;
                }

                // não passa a TX, ou seja, ele que seja responsável por sua própria $transaction
                for (const job of jobs) {
                    await this.atualizaSof(job.ano);
                }
            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 15,
                isolationLevel: 'Serializable',
            },
        );
    }

    async atualizaSof(ano: number) {
        ano = Number(ano);
        const before = Date.now();
        this.logger.log(`Atualizando SOF -- ${ano}`);
        const data = await this.sof.entidades(ano);
        await this.prisma.sofEntidade.upsert({
            where: { ano: ano },
            create: {
                ano: ano,
                atualizado_em: new Date(Date.now()),
                dados: data,
            },
            update: {
                atualizado_em: new Date(Date.now()),
                dados: data,
            },
        });
        this.logger.log(`Atualização SOF concluída em ${Math.round((Date.now() - before) / 1000)} segundos, atualizando MV sof_entidades_linhas`);

        try {
            await this.prisma.$queryRaw`refresh materialized view sof_entidades_linhas;`;
            this.logger.log(`MV sof_entidades_linhas atualizada com sucesso.`);
        } catch (error) {
            const errmsg = `Erro ao atualizar materialized view sof_entidades_linhas após atualização deste ano: ${error.toString()}`;
            this.logger.error(errmsg);

            await this.prisma.sofEntidade.updateMany({
                where: { ano: ano },
                data: {
                    errmsg: errmsg,
                },
            });
            console.log(error);
        }
    }
}

import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { CicloFisicoFase, PdmPerfilTipo, Prisma } from '@prisma/client';
import { DateTime } from 'luxon';
import { VariavelService } from 'src/variavel/variavel.service';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CONST_BOT_USER_ID } from '../common/consts';
import { Date2YMD, DateYMD, SYSTEM_TIMEZONE } from '../common/date2ymd';
import { TipoPdmType } from '../common/decorators/current-tipo-pdm';
import { JOB_PDM_CICLO_LOCK } from '../common/dto/locks';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { LoggerWithLog } from '../common/LoggerWithLog';
import { PrismaService } from '../prisma/prisma.service';
import { UploadService } from '../upload/upload.service';
import { UpdatePdmCicloConfigDto } from './dto/create-pdm.dto';
import { CicloFisicoDto } from './dto/list-pdm.dto';

type CicloFisicoResumo = {
    id: number;
    pdm_id: number;
    data_ciclo: Date;
    ciclo_fase_atual_id: number | null;
    CicloFaseAtual: CicloFisicoFase | null;
};

export class AdminCpDbItem {
    tipo: PdmPerfilTipo;
    orgao_id: number;
    equipe_id: number;
}

@Injectable()
export class PdmCicloService {
    private readonly logger = new Logger(PdmCicloService.name);
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => UploadService))
        private readonly variavelService: VariavelService
    ) {}

    async executaJobCicloFisico(ativo: boolean | undefined, pdmId: number, now: Date) {
        // se esse pdm é pra estar ativado,
        // verificar se há algum item com acordar_ciclo_em, se não existir,
        // precisa encontrar qual é o mes corrente que deve acordar
        // ps: na hora de buscar o mes corrente, vamos usar a data final das fase, no lugar da data do ciclo
        if (ativo) {
            const updatedRows = await this.prisma.$executeRaw`
                update ciclo_fisico
                set
                    acordar_ciclo_em = now(),
                    acordar_ciclo_executou_em = null -- garante que será executado imediatamente após o save
                where id = (
                    select a.ciclo_fisico_id
                    from ciclo_fisico_fase a
                    join ciclo_fisico b on b.id=a.ciclo_fisico_id
                    where b.pdm_id = ${pdmId}::int
                    and data_fim <= date_trunc('day', now() at time zone ${SYSTEM_TIMEZONE}::varchar)
                    order by data_fim desc
                    limit 1
                )
                and (select count(1) from ciclo_fisico where acordar_ciclo_em is not null and pdm_id = ${pdmId}::int) = 0;`;
            this.logger.log(`atualizacao de acordar_ciclos atualizou ${updatedRows} linha`);
        }

        // imediatamente, roda quantas vezes for necessário as evoluções de ciclo
        // eslint-disable-next-line no-constant-condition
        while (1) {
            const keepGoing = await this.verificaCiclosPendentes(Date2YMD.toString(now));
            if (!keepGoing) break;
        }
    }

    @Cron('0 * * * *')
    async handleCron() {
        if (process.env['DISABLE_PDM_CRONTAB']) return;

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                this.logger.debug(`Adquirindo lock para verificação dos ciclos`);
                const locked: {
                    locked: boolean;
                    now_ymd: DateYMD;
                }[] = await prismaTx.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_PDM_CICLO_LOCK}) as locked,
                (now() at time zone ${SYSTEM_TIMEZONE}::varchar)::date::text as now_ymd
            `;
                if (!locked[0].locked) {
                    this.logger.debug(`Já está em processamento...`);
                    return;
                }

                // Process active PDMs with configuration-based cycles
                await this.processConfigBasedCycles(locked[0].now_ymd);

                // Processa os pdm de ciclos legados (PDM antigo)
                // não passa a TX, ou seja, ele que seja responsável por sua própria $transaction
                // eslint-disable-next-line no-constant-condition
                while (1) {
                    const keepGoing = await this.verificaCiclosPendentes(locked[0].now_ymd);
                    if (!keepGoing) break;
                }

                await this.variavelService.processVariaveisSuspensas(prismaTx);

                this.logger.debug(`Atualizando metas consolidadas`);
                await prismaTx.$queryRaw`
                    SELECT f_add_refresh_meta_task(meta_id)::text
                    FROM meta_status_consolidado_cf cf
                    WHERE (atualizado_em at time zone ${SYSTEM_TIMEZONE})::date != current_date at time zone ${SYSTEM_TIMEZONE}
                `;
            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 5,
                isolationLevel: 'Serializable',
            }
        );
    }

    private async processConfigBasedCycles(hoje: DateYMD) {
        this.logger.debug(`Processando ciclos configurados via PdmCicloConfig ${hoje}...`);

        // Verifica se há alguma configuração de ciclo ativa
        const configs = await this.prisma.pdmCicloConfig.findMany({
            where: {
                ultima_revisao: true,
                removido_em: null,
                pdm: {
                    ativo: true,
                    tipo: { in: ['PS', 'PDM'] },
                    removido_em: null,
                },
                AND: [
                    {
                        OR: [{ data_fim: null }, { data_fim: { gte: hoje } }],
                    },
                    {
                        pdm: {
                            CicloFisico: {
                                some: {
                                    acordar_ciclo_em: {
                                        lte: new Date(Date.now()),
                                    },
                                },
                            },
                        },
                    },
                ],
            },
            select: {
                pdm_id: true,
            },
        });

        if (configs.length === 0) {
            this.logger.debug('Nenhuma configuração de ciclo ativa encontrada.');
            return;
        }

        const pdmIds = configs.map((config) => config.pdm_id);

        // Try processing all PDMs at once, then chunk if needed
        await this.processPdmIdsInChunks(pdmIds, 'Todos os PDMs/PS', Math.min(pdmIds.length, 1000));
    }

    private async processPdmIdsInChunks(
        pdmIds: number[],
        chunkDescription: string,
        originalSize: number,
        chunkSize: number = 0
    ) {
        if (chunkSize <= 0) chunkSize = pdmIds.length;

        if (pdmIds.length === 0) return;

        // Dividir em lotes (inicialmente apenas um lote com todos os itens)
        const chunks: number[][] = [];
        for (let i = 0; i < pdmIds.length; i += chunkSize) {
            chunks.push(pdmIds.slice(i, i + chunkSize));
        }

        for (const chunk of chunks) {
            try {
                this.logger.log(
                    `Tentando processar lote de ${chunk.length}/${originalSize} PDMs/PS (${chunkDescription})`
                );

                await this.prisma.$transaction(
                    async (prismaTx: Prisma.TransactionClient) => {
                        // Usa UNNEST para processar todos os IDs de uma vez
                        await prismaTx.$queryRaw`
                            WITH pdm_ids AS (SELECT unnest(${chunk}::int[]) AS id)
                            SELECT atualiza_ciclos_config(id)::text FROM pdm_ids
                        `;
                    },
                    {
                        isolationLevel: 'Serializable',
                        maxWait: 30000,
                        timeout: 60 * 1000 * 5,
                    }
                );

                this.logger.log(`Processamento bem-sucedido para lote de ${chunk.length} PDMs/PS`);
            } catch (error) {
                if (chunk.length === 1) {
                    const logger = LoggerWithLog('PdmCicloService.processPdmIdsInChunks');
                    logger.error(`Falha ao processar PDM/PS ${chunk[0]}: ${error.message}`, error.stack);
                    // Se somente um item falhar, logar e seguir em frente
                    this.logger.error(`Falha ao processar PDM/PS ${chunk[0]}: ${error.message}`, error.stack);

                    await logger.saveLogs(this.prisma, { pessoa_id: CONST_BOT_USER_ID });
                } else {
                    // Dividir o lote em dois e tentar novamente
                    const halfSize = Math.max(1, Math.ceil(chunk.length / 2));
                    this.logger.warn(`Falha ao processar lote de ${chunk.length} PDMs/PS. Dividindo em lotes menores.`);

                    await this.processPdmIdsInChunks(
                        chunk.slice(0, halfSize),
                        `Primeira metade (${halfSize} itens)`,
                        originalSize,
                        halfSize
                    );

                    await this.processPdmIdsInChunks(
                        chunk.slice(halfSize),
                        `Segunda metade (${chunk.length - halfSize} itens)`,
                        originalSize,
                        halfSize
                    );
                }
            }
        }
    }

    private async verificaCiclosPendentes(hoje: DateYMD) {
        this.logger.debug(`Verificando ciclos físicos legado com tick faltando... ${hoje}`);

        // busca apenas "os" pdm's antigo, que nunca tiveram a configuração de ciclo nova
        const pdms = await this.prisma.pdm.findMany({
            where: {
                ativo: true,
                tipo: { in: ['PDM'] },
                removido_em: null,
                AND: {
                    PdmCicloConfig: {
                        none: {},
                    },
                },
            },
            select: { id: true },
        });

        const cf = await this.prisma.cicloFisico.findFirst({
            where: {
                pdm_id: { in: pdms.map((pdm) => pdm.id) },
                acordar_ciclo_em: {
                    lt: new Date(Date.now()),
                },
                OR: [
                    { acordar_ciclo_errmsg: null },
                    {
                        // retry a cada 15 minutos, mesmo que tenha erro
                        acordar_ciclo_executou_em: {
                            lt: DateTime.now().minus({ minutes: 15 }).toJSDate(),
                        },
                        acordar_ciclo_errmsg: { not: null },
                    },
                ],
                // evitar loops infinitos, verificar que tem pelo menos 1 min desde a ultima execução
                AND: [
                    {
                        OR: [
                            { acordar_ciclo_executou_em: null },
                            {
                                acordar_ciclo_executou_em: {
                                    lt: DateTime.now().minus({ minutes: 1 }).toJSDate(),
                                },
                            },
                        ],
                    },
                ],
            },
            select: {
                pdm_id: true,
                id: true,
                data_ciclo: true,
                ativo: true,
                ciclo_fase_atual_id: true,
                acordar_ciclo_errmsg: true,
                pdm: {
                    select: { ativo: true },
                },
                CicloFaseAtual: true,
            },
            orderBy: {
                data_ciclo: 'asc',
            },
            take: 1,
        });
        if (!cf) {
            this.logger.log('Não há Ciclo Físico com processamento pendente');
            return false;
        }

        this.logger.log(`Executando ciclo ${JSON.stringify(cf)} hoje=${hoje} (data hora pelo banco)`);

        try {
            if (cf.acordar_ciclo_errmsg) {
                this.logger.warn(
                    `Mensagem de erro anterior: ${cf.acordar_ciclo_errmsg}, limpando mensagem e tentando novamente...`
                );
                await this.prisma.cicloFisico.update({
                    where: { id: cf.id },
                    data: { acordar_ciclo_errmsg: null },
                });
            }

            if (cf.pdm.ativo) {
                await this.verificaFases(cf);
            } else {
                this.logger.warn('PDM foi desativado, não há mais ciclos até a proxima ativação');

                await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
                    await prismaTxn.cicloFisico.update({
                        where: {
                            id: cf.id,
                        },
                        data: {
                            acordar_ciclo_em: null,
                            acordar_ciclo_executou_em: new Date(Date.now()),
                            ciclo_fase_atual_id: null,
                            ativo: false,
                        },
                    });
                });
            }
        } catch (error) {
            this.logger.error(error);
            await this.prisma.cicloFisico.update({
                where: {
                    id: cf.id,
                },
                data: {
                    acordar_ciclo_errmsg: `${error}`,
                    acordar_ciclo_executou_em: new Date(Date.now()),
                },
            });
        }

        return true;
    }

    private async verificaFases(cf: CicloFisicoResumo) {
        const hojeEmSp = DateTime.local({ zone: SYSTEM_TIMEZONE }).toJSDate();
        this.logger.log(`Verificando ciclo atual ${cf.data_ciclo} - Hoje em SP = ${Date2YMD.toString(hojeEmSp)}`);

        if (cf.CicloFaseAtual) {
            this.logger.log(
                'No banco, fase atual é ' +
                    cf.CicloFaseAtual.id +
                    ` com inicio em ${Date2YMD.toString(cf.CicloFaseAtual.data_inicio)} e fim ${Date2YMD.toString(
                        cf.CicloFaseAtual.data_fim
                    )}`
            );
        } else {
            this.logger.log(`Não há nenhuma fase atualmente associada com o Ciclo Fisico`);
            this.logger.debug(
                'ciclo_fase_atual_id está null, provavelmente o ciclo não deveria ter sido executado ainda,' +
                    ' ou o PDM acabou de ser re-ativado, ou é a primeira vez do ciclo'
            );
        }

        const fase_corrente = await this.prisma.cicloFisicoFase.findFirst({
            where: {
                ciclo_fisico: { pdm_id: cf.pdm_id },
                data_inicio: { lte: hojeEmSp },
                data_fim: { gte: hojeEmSp }, // termina dentro da data corrente
            },
            orderBy: { data_inicio: 'desc' },
            take: 1,
        });

        if (!fase_corrente) {
            await this.desativaCicloParaSempre({ id: cf.id, pdm_id: cf.pdm_id });
            return;
        }

        this.logger.log(`Fase corrente: ${JSON.stringify(fase_corrente)}`);
        if (cf.ciclo_fase_atual_id === null || cf.ciclo_fase_atual_id !== fase_corrente.id) {
            await this.cicloFisicoAtualizaFase(cf, fase_corrente);
        } else {
            // aqui não precisa de transaction pois ele tenta primeiro atualizar a função
            // e se falhar, vai rolar o retry
            this.logger.log(`Recalculando permissões de acesso ao PDM (nova meta?)`);
            await this.prisma.$queryRaw`select atualiza_fase_meta_pdm(${cf.pdm_id}::int, ${cf.id}::int)`;

            await this.prisma.cicloFisico.update({
                where: { id: cf.id },
                data: {
                    acordar_ciclo_em: Date2YMD.tzSp2UTC(Date2YMD.incDaysFromISO(fase_corrente.data_fim, 1)),
                    acordar_ciclo_executou_em: new Date(Date.now()),
                    ativo: true,
                },
            });
        }
    }

    private async cicloFisicoAtualizaFase(cf: CicloFisicoResumo, fase_corrente: CicloFisicoFase) {
        const pdm_id = cf.pdm_id;
        let ciclo_fisico_id = fase_corrente.ciclo_fisico_id;

        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            if (cf.ciclo_fase_atual_id === null)
                this.logger.log(`Iniciando ciclo id=${cf.id}, data ${cf.data_ciclo}) pela primeira vez!`);

            // se mudou de ciclo_fisico, precisa fechar e re-abrir
            if (fase_corrente.ciclo_fisico_id !== cf.id) {
                this.logger.log(`Desativando o ciclo id=${cf.id}, data ${cf.data_ciclo})...`);
                // aqui entraria um código pra fazer o fechamento,
                // se precisar disparar algum email ou algo do tipo
                await prismaTxn.cicloFisico.update({
                    where: { id: cf.id },
                    data: {
                        acordar_ciclo_em: null,
                        acordar_ciclo_executou_em: new Date(Date.now()),
                        ativo: false,
                    },
                });

                ciclo_fisico_id = fase_corrente.ciclo_fisico_id;
            }

            this.logger.log(
                `Trocando fase do ciclo de ${cf.ciclo_fase_atual_id ?? 'null'} para ${fase_corrente.id} (${
                    fase_corrente.ciclo_fase
                })`
            );

            await prismaTxn.cicloFisico.update({
                where: { id: ciclo_fisico_id },
                data: {
                    acordar_ciclo_em: Date2YMD.tzSp2UTC(Date2YMD.incDaysFromISO(fase_corrente.data_fim, 1)),
                    acordar_ciclo_executou_em: new Date(Date.now()),
                    ciclo_fase_atual_id: fase_corrente.id,
                    ativo: true,
                },
            });

            this.logger.log(`chamando atualiza_fase_meta_pdm(${pdm_id}, ${ciclo_fisico_id})`);
            await prismaTxn.$queryRaw`select atualiza_fase_meta_pdm(${pdm_id}::int, ${ciclo_fisico_id}::int)`;
        });
    }

    private async desativaCicloParaSempre(cf: { id: number; pdm_id: number }) {
        await this.prisma.$transaction(async (prismaTxn: Prisma.TransactionClient) => {
            this.logger.log(`Não há próximos ciclos!`);
            // aqui entraria um código pra fazer o ultimo fechamento, se precisar disparar algum email ou algo do tipo

            await prismaTxn.cicloFisico.update({
                where: { id: cf.id },
                data: {
                    acordar_ciclo_em: null,
                    acordar_ciclo_executou_em: new Date(Date.now()),
                    ciclo_fase_atual_id: null,
                    ativo: false,
                },
            });

            this.logger.log(`Recalculando atualiza_fase_meta_pdm(${cf.pdm_id}, NULL) para desativar as metas`);
            await prismaTxn.$queryRaw`select atualiza_fase_meta_pdm(${cf.pdm_id}::int, NULL)`;
        });
    }

    async getCicloAtivo(pdm_id: number): Promise<CicloFisicoDto | null> {
        let ciclo: CicloFisicoDto | null = null;
        const found = await this.prisma.cicloFisico.findFirst({
            where: { pdm_id: pdm_id, ativo: true },
            include: {
                fases: {
                    orderBy: { data_inicio: 'asc' },
                },
            },
        });
        if (found) {
            ciclo = {
                id: found.id,
                data_ciclo: Date2YMD.toString(found.data_ciclo),
                fases: [],
                ativo: found.ativo,
            };
            for (const fase of found.fases) {
                ciclo.fases.push({
                    id: fase.id,
                    ciclo_fase: fase.ciclo_fase,
                    data_inicio: Date2YMD.toString(fase.data_inicio),
                    data_fim: Date2YMD.toString(fase.data_fim),
                    fase_corrente: found.ciclo_fase_atual_id == fase.id,
                });
            }
        }

        return ciclo;
    }

    async updateCicloConfig(
        _tipo: TipoPdmType,
        pdmId: number,
        dto: UpdatePdmCicloConfigDto,
        user: PessoaFromJwt,
        prismaCtx?: Prisma.TransactionClient | undefined
    ): Promise<RecordWithId> {
        const prisma = prismaCtx ?? this.prisma;
        const pdm = await prisma.pdm.findUniqueOrThrow({
            where: { id: pdmId },
            select: { sistema: true },
        });
        if (pdm.sistema === 'PDM') throw new Error('Operação não permitida para PDMs antigos');
        if (dto.meses && dto.meses.length > 0 && !dto.data_inicio)
            throw new Error('Data de início é obrigatória quando há meses configurados');

        const countExistentes = await prisma.cicloFisico.count({
            where: {
                pdm_id: pdmId,
                tipo: 'PDM',
            },
        });
        if (countExistentes > 0)
            throw new Error('Já existe um ciclo físico do tipo antigo para este Programa de Metas');

        const now = new Date();
        const performUpdate = async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.pdmCicloConfig.updateMany({
                where: {
                    pdm_id: pdmId,
                    ultima_revisao: true,
                },
                data: {
                    ultima_revisao: null,
                    removido_em: now,
                    removido_por: user.id,
                },
            });

            const previousData = await prismaTx.pdmCicloConfig.findFirst({
                where: {
                    pdm_id: pdmId,
                    ultima_revisao: true,
                    removido_em: null,
                },
            });

            // Create new configuration
            const config = await prismaTx.pdmCicloConfig.create({
                data: {
                    pdm_id: pdmId,
                    meses: dto.meses ?? previousData?.meses ?? [],
                    data_inicio: dto.data_inicio ?? previousData?.data_inicio ?? null,
                    data_fim: dto.data_fim ?? previousData?.data_fim ?? null,
                    ultima_revisao: true,
                    criado_por: user.id,
                },
                select: { id: true },
            });

            this.logger.log(`Ciclo config created with id: ${config.id}`);

            // Call function to update future cycles
            await prismaTx.$queryRaw`SELECT atualiza_ciclos_config(${pdmId}::int)::text`;

            return config;
        };

        let ret;
        if (prismaCtx) {
            ret = await performUpdate(prismaCtx);
        } else {
            ret = await this.prisma.$transaction(
                async (prismaTx: Prisma.TransactionClient) => {
                    return await performUpdate(prismaTx);
                },
                {
                    isolationLevel: 'Serializable',
                    maxWait: 5000,
                    timeout: 5000,
                }
            );
        }
        return ret;
    }
}

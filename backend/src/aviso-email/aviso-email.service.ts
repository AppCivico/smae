import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAvisoEmailDto } from './dto/create-aviso-email.dto';
import { UpdateAvisoEmailDto } from './dto/update-aviso-email.dto';
import { AvisoEmailItemDto, FilterAvisoEamilDto } from './entities/aviso-email.entity';
import { Cron, CronExpression } from '@nestjs/schedule';
import { CrontabIsEnabled } from '../common/CrontabIsEnabled';
import { JOB_AVISO_EMAIL } from '../common/dto/locks';
import { DateYMD, SYSTEM_TIMEZONE } from '../common/date2ymd';
import { DateTime } from 'luxon';
import { TaskService } from '../task/task.service';
import { NotaService } from '../bloco-nota/nota/nota.service';

@Injectable()
export class AvisoEmailService {
    private enabled: boolean;
    private readonly logger = new Logger(AvisoEmailService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly taskService: TaskService,
        private readonly notaService: NotaService
    ) {
        this.enabled = CrontabIsEnabled('aviso_email');
    }

    async create(dto: CreateAvisoEmailDto, user: PessoaFromJwt): Promise<RecordWithId> {
        let tarefa_id = dto.tarefa_id;
        let tarefa_cronograma_id = tarefa_id ? undefined : await this.resolveCronoEtapaId(dto);
        let nota_id = dto.nota_jwt ? this.notaService.checkToken(dto.nota_jwt) : undefined;

        if (tarefa_id && tarefa_cronograma_id) {
            throw new BadRequestException(
                `Só pode ser do cronograma ou da tarefa, não pode ser de ambos ao mesmo tempo.`
            );
        }

        if (dto.tipo == 'CronogramaTerminoPlanejado') {
            if (!tarefa_id && !tarefa_cronograma_id)
                throw new BadRequestException(
                    `Aviso de término planejado próximo precisa ser associado com uma tarefa ou cronograma.`
                );
            nota_id = undefined;
        } else if (dto.tipo == 'Nota') {
            if (!nota_id) throw new BadRequestException(`Aviso de nota precisa ser associado com uma nota.`);
            tarefa_id = undefined;
            tarefa_cronograma_id = undefined;
        }

        const created = await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient): Promise<RecordWithId> => {
                const exists = await prismaTx.avisoEmail.count({
                    where: {
                        tarefa_cronograma_id,
                        tarefa_id,
                        nota_id,
                        removido_em: null,
                    },
                });
                if (exists)
                    throw new BadRequestException(
                        `Já existe um aviso configurado para essa tarefa, cronograma ou nota.`
                    );

                const created = await prismaTx.avisoEmail.create({
                    data: {
                        tarefa_cronograma_id,
                        tarefa_id,
                        nota_id,
                        ativo: dto.ativo,
                        numero: dto.numero,
                        numero_periodo: dto.numero_periodo,
                        tipo: dto.tipo,
                        com_copia: dto.com_copia,
                        recorrencia_dias: dto.recorrencia_dias,
                    },
                });

                return { id: created.id };
            }
        );

        return { id: created.id };
    }

    private async resolveCronoEtapaId(dto: {
        tarefa_cronograma_id?: number;
        projeto_id?: number;
        transferencia_id?: number;
    }) {
        const tarefa_cronograma_id = await this.resolveCronoEtapaIdOrUndef(dto);
        if (!tarefa_cronograma_id) throw new BadRequestException('Faltando tarefa_cronograma_id');
        return tarefa_cronograma_id;
    }

    private async resolveCronoEtapaIdOrUndef(dto: {
        tarefa_cronograma_id?: number | undefined;
        projeto_id?: number | undefined;
        transferencia_id?: number | undefined;
    }) {
        let tarefa_cronograma_id = dto.tarefa_cronograma_id;
        if (!tarefa_cronograma_id) {
            if (dto.projeto_id) {
                const tmp = await this.prisma.tarefaCronograma.findFirstOrThrow({
                    where: { removido_em: null, projeto_id: dto.projeto_id },
                    select: { id: true },
                });
                tarefa_cronograma_id = tmp.id;
            }
            if (dto.transferencia_id) {
                const tmp = await this.prisma.tarefaCronograma.findFirstOrThrow({
                    where: { removido_em: null, transferencia_id: dto.transferencia_id },
                    select: { id: true },
                });
                tarefa_cronograma_id = tmp.id;
            }
        }
        return tarefa_cronograma_id;
    }

    async findAll(filter: FilterAvisoEamilDto, user: PessoaFromJwt): Promise<AvisoEmailItemDto[]> {
        const tarefa_cronograma_id = filter.id ? undefined : await this.resolveCronoEtapaIdOrUndef(filter);

        const nota_id = filter.nota_jwt ? this.notaService.checkToken(filter.nota_jwt) : filter.nota_id;

        const rows = await this.prisma.avisoEmail.findMany({
            where: {
                id: filter.id,
                tarefa_cronograma_id: tarefa_cronograma_id,
                nota_id: nota_id,
                tarefa_id: filter.tarefa_id,
                removido_em: null,
            },
            include: {
                tarefa: {
                    select: {
                        id: true,
                        descricao: true,
                    },
                },
                tarefa_cronograma: {
                    select: {
                        projeto: {
                            select: { id: true, nome: true },
                        },
                        transferencia_id: true,
                    },
                },
            },
            orderBy: { id: 'asc' },
        });

        // os dois any abaixo são por causa que o Prisma não gera a tipagem por causa do ternário do filter.retornar_uso
        return rows.map((r) => {
            return {
                id: r.id,
                ativo: r.ativo,
                com_copia: r.com_copia,
                numero: r.numero,
                numero_periodo: r.numero_periodo,
                recorrencia_dias: r.recorrencia_dias,
                nota_id: r.nota_id,
                tipo: r.tipo,
                transferencia_id: r.tarefa_cronograma?.transferencia_id ?? null,
                projeto: r.tarefa_cronograma?.projeto ?? null,
                tarefa: r.tarefa ?? null,
            };
        });
    }

    async update(id: number, dto: UpdateAvisoEmailDto, user: PessoaFromJwt): Promise<RecordWithId> {
        // TODO: verificar permissões e etc. isso aqui é só o mínimo possível
        const exists = await this.prisma.avisoEmail.findFirst({
            where: {
                id,
            },
            select: { id: true },
        });
        if (!exists) throw new NotFoundException('Item não encontrado');

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            await prismaTx.avisoEmail.update({
                where: {
                    id: exists.id,
                },
                data: {
                    ativo: dto.ativo,
                    numero: dto.numero,
                    numero_periodo: dto.numero_periodo,
                    com_copia: dto.com_copia,
                    recorrencia_dias: dto.recorrencia_dias,
                },
            });

            return;
        });

        return { id: exists.id };
    }

    async remove(id: number, user: PessoaFromJwt) {
        // TODO: verificar permissões e etc. isso aqui é só o mínimo possível
        const exists = await this.prisma.avisoEmail.findFirst({
            where: {
                id,
                removido_em: null,
            },
            select: { id: true },
        });

        if (!exists) return;

        await this.prisma.avisoEmail.updateMany({
            where: {
                id,
                removido_em: null,
            },
            data: {
                removido_em: new Date(Date.now()),
                removido_por: user.id,
            },
        });

        return;
    }

    @Cron(CronExpression.EVERY_30_MINUTES_BETWEEN_10AM_AND_7PM)
    async handleCron() {
        if (!this.enabled) return;

        await this.prisma.$transaction(
            async (prismaTx: Prisma.TransactionClient) => {
                this.logger.debug(`Adquirindo lock para verificação dos avisos por emails`);
                const locked: {
                    locked: boolean;
                    now_ymd: DateYMD;
                }[] = await prismaTx.$queryRaw`SELECT
                pg_try_advisory_xact_lock(${JOB_AVISO_EMAIL}) as locked,
                (now() at time zone ${SYSTEM_TIMEZONE}::varchar)::date::text as now_ymd
            `;
                if (!locked[0].locked) {
                    this.logger.debug(`Já está em processamento...`);
                    return;
                }

                await this.verificaAvisosPorEmail(DateTime.fromISO(locked[0].now_ymd));
            },
            {
                maxWait: 30000,
                timeout: 60 * 1000 * 5,
                isolationLevel: 'Serializable',
            }
        );
    }

    private async verificaAvisosPorEmail(ymd: DateTime) {
        const today = ymd.toJSDate();
        const now = new Date(Date.now());

        await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
            const pendingRun = await prismaTx.avisoEmail.findMany({
                where: {
                    removido_em: null,
                    ativo: true,
                    executou_em: { lt: today },
                },
                select: {
                    id: true,
                },
            });

            if (pendingRun.length) {
                this.logger.log(`Adicionando ${pendingRun.length} jobs na fila...`);

                for (const r of pendingRun) {
                    const t = await this.taskService.create(
                        {
                            params: { aviso_email_id: r.id },
                            type: 'aviso_email',
                        },
                        null,
                        prismaTx
                    );

                    this.logger.log(`Aviso id = ${r.id} task ${t.id}`);
                }

                await prismaTx.avisoEmail.updateMany({
                    where: {
                        id: { in: pendingRun.map((r) => r.id) },
                    },
                    data: {
                        executou_em: today,
                        executou_em_ts: now,
                    },
                });
            } else {
                this.logger.log(`Nenhum aviso pendente no momento.`);
            }
        });
    }
}

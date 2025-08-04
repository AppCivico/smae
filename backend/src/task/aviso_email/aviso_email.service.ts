import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { AvisoEmail, Nota, Prisma, Tarefa, TarefaCronograma } from 'src/generated/prisma/client';
import { DateTime } from 'luxon';
import { PrismaService } from '../../prisma/prisma.service';
import { TaskableService } from '../entities/task.entity';
import { TaskService } from '../task.service';
import { CreateAvisoEmailJobDto } from './dto/create-aviso_email.dto';
import { CreateAeCronogramaTpJobDto } from '../aviso_email_cronograma_tp/dto/ae_cronograma_tp.dto';
import { CreateNotaJobDto } from '../aviso_email_nota/dto/ae_nota.dto';
import { NotaService } from '../../bloco-nota/nota/nota.service';

type AvisoComCronograma = AvisoEmail & { tarefa: Tarefa | null } & { tarefa_cronograma: TarefaCronograma | null };

@Injectable()
export class AvisoEmailTaskService implements TaskableService {
    private readonly logger = new Logger(AvisoEmailTaskService.name);
    constructor(
        private readonly prisma: PrismaService,
        @Inject(forwardRef(() => TaskService)) private readonly taskService: TaskService,
        @Inject(forwardRef(() => NotaService)) private readonly notaService: NotaService
    ) {}

    async executeJob(inputParams: CreateAvisoEmailJobDto, _taskId: string): Promise<any> {
        this.logger.verbose(`Carregando aviso-email id ${inputParams.aviso_email_id}`);

        let job_id: number | undefined = undefined;
        const aviso_email = await this.prisma.avisoEmail.findFirstOrThrow({
            where: { id: inputParams.aviso_email_id },
            include: {
                tarefa_cronograma: true,
                tarefa: true,
                nota: true,
            },
        });

        if (aviso_email.tarefa_cronograma && aviso_email.tarefa_cronograma.removido_em) {
            await this.desativaAvisoEmail(aviso_email);
            return { success: true, mensagem: 'Cronograma removido' };
        }

        if (aviso_email.tarefa && aviso_email.tarefa.removido_em) {
            await this.desativaAvisoEmail(aviso_email);
            return { success: true, mensagem: 'Tarefa removido' };
        }

        if (aviso_email.nota && aviso_email.nota.removido_em) {
            await this.desativaAvisoEmail(aviso_email);
            return { success: true, mensagem: 'Nota removido' };
        }

        if (aviso_email.nota) {
            const notaValida = await this.notaService.checkNotaValida(aviso_email.nota);
            if (!notaValida) {
                await this.desativaAvisoEmail(aviso_email);
                return { success: true, mensagem: 'Objeto da nota foi removido' };
            }
        }

        const deveProcessar = this.deveProcessarAvisoEmail(aviso_email);
        if (!deveProcessar) {
            return { success: true, mensagem: this.geraMensagem(aviso_email) };
        }

        const now = new Date(Date.now());
        if (aviso_email.tipo == 'CronogramaTerminoPlanejado') {
            const dataTermPlanejado = this.resolveDataTermPlanejado(aviso_email);
            const dataTermAviso = this.resolveDataTermino(aviso_email);

            if (dataTermPlanejado.valueOf() >= dataTermAviso.valueOf()) {
                return {
                    success: true,
                    mensagem: this.geraMensagemEspera(dataTermPlanejado, dataTermAviso),
                };
            }

            await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
                const job = await this.taskService.create(
                    {
                        params: {
                            tarefa_cronograma_id: aviso_email.tarefa_cronograma_id ?? undefined,
                            tarefa_id: aviso_email.tarefa_id ?? undefined,
                            aviso_email_id: aviso_email.id,
                            cc: aviso_email.com_copia,
                        } satisfies CreateAeCronogramaTpJobDto,
                        type: 'aviso_email_cronograma_tp',
                    },
                    null,
                    prismaTx
                );
                job_id = job.id;

                this.logger.verbose(`Tarefa agendada id=${job_id} para produção do e-mail, com disparo ou não`);

                await prismaTx.avisoEmail.update({
                    where: { id: aviso_email.id },
                    data: { ultimo_envio_em: now },
                });
            });
        } else if (aviso_email.tipo == 'Nota' && aviso_email.nota_id) {
            await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient) => {
                const job = await this.taskService.create(
                    {
                        params: {
                            nota_id: aviso_email.nota_id!,
                            aviso_email_id: aviso_email.id,
                            cc: aviso_email.com_copia,
                        } satisfies CreateNotaJobDto,
                        type: 'aviso_email_nota',
                    },
                    null,
                    prismaTx
                );
                job_id = job.id;

                this.logger.verbose(`Tarefa agendada id=${job_id} para produção do e-mail, com disparo ou não`);

                await prismaTx.avisoEmail.update({
                    where: { id: aviso_email.id },
                    data: { ultimo_envio_em: now },
                });
            });
        }

        return {
            job_id,
            success: !!job_id,
        };
    }

    private async desativaAvisoEmail(aviso_email: { id: number }) {
        await this.prisma.avisoEmail.update({
            where: { id: aviso_email.id },
            data: { ativo: false },
        });
    }

    private resolveDataTermPlanejadoOrUndef(aviso_email: AvisoComCronograma) {
        const dataTermTarefaPlan = aviso_email.tarefa ? aviso_email.tarefa.termino_planejado : undefined;
        const dataTermCronoPlan = aviso_email.tarefa_cronograma
            ? aviso_email.tarefa_cronograma.previsao_termino
            : undefined;

        const dataTermPlanejado = dataTermTarefaPlan ?? dataTermCronoPlan;
        return dataTermPlanejado ?? undefined;
    }

    private resolveDataTermPlanejado(aviso_email: AvisoComCronograma): Date {
        const data = this.resolveDataTermPlanejadoOrUndef(aviso_email);
        if (!data) throw 'Faltando data de planejamento';
        return data;
    }

    private resolveDataTermino(aviso: AvisoEmail): Date {
        let data_atraso = DateTime.local({ zone: 'UTC' });
        const numero = aviso.numero;
        switch (aviso.numero_periodo) {
            case 'Anos':
                data_atraso = data_atraso.plus({ years: numero });
                break;
            case 'Dias':
                data_atraso = data_atraso.plus({ days: numero });
                break;
            case 'Meses':
                data_atraso = data_atraso.plus({ months: numero });
                break;
            case 'Semanas':
                data_atraso = data_atraso.plus({ weeks: numero });
                break;
            default:
                aviso.numero_periodo satisfies never;
        }

        const date = data_atraso.startOf('day');
        this.logger.verbose(
            `Aviso Email: numero=${aviso.numero} numero_periodo=${aviso.numero_periodo} -- data calculada=${date.toISODate()}`
        );
        return date.toJSDate();
    }

    private deveProcessarAvisoEmail(aviso_email: AvisoComCronograma & { nota: Nota | null }): boolean {
        if (!aviso_email.ativo) {
            return false;
        }

        let ultimo_envio_em = aviso_email.ultimo_envio_em;
        if (ultimo_envio_em && aviso_email.nota && aviso_email.nota.rever_em) {
            const today = DateTime.now();
            const rever_em = DateTime.fromJSDate(aviso_email.nota.rever_em);
            const fromToday = rever_em.diff(today).as('days');

            if (fromToday >= 0 && rever_em.valueOf() >= DateTime.fromJSDate(ultimo_envio_em).valueOf()) {
                ultimo_envio_em = null;
            }
        }

        if (ultimo_envio_em) {
            if (aviso_email.recorrencia_dias === 0) {
                return false;
            }

            const diffAsDay = DateTime.now().diff(DateTime.fromJSDate(ultimo_envio_em)).as('days');
            this.logger.verbose(
                `aviso_email.ultimo_envio_em = ${ultimo_envio_em}, diff as days=${diffAsDay}, aviso-email recorrencia_dias=${aviso_email.recorrencia_dias}`
            );

            if (diffAsDay < aviso_email.recorrencia_dias) {
                return false;
            }
        }

        if (aviso_email.tipo == 'CronogramaTerminoPlanejado') {
            if (aviso_email.tarefa && aviso_email.tarefa.termino_real) {
                return false;
            }

            if (aviso_email.tarefa_cronograma && aviso_email.tarefa_cronograma.realizado_termino) {
                return false;
            }

            const dataTermPlanejado = this.resolveDataTermPlanejado(aviso_email);
            if (!dataTermPlanejado) return false;
        } else if (aviso_email.tipo == 'Nota' && aviso_email.nota) {
            const today = DateTime.now();
            const rever_em = aviso_email.nota.rever_em ? DateTime.fromJSDate(aviso_email.nota.rever_em) : undefined;
            const data_nota = DateTime.fromJSDate(aviso_email.nota.data_nota);

            const fromData = data_nota.diff(today).as('days');
            const fromRever = rever_em ? rever_em.diff(today).as('days') : undefined;

            console.log(fromData);

            if (fromData >= 0 || (fromRever && fromRever >= 0)) return false;
        }

        return true;
    }

    private geraMensagem(aviso_email: AvisoComCronograma): string {
        if (!aviso_email.ativo) {
            return 'aviso desativado';
        }

        if (aviso_email.ultimo_envio_em && aviso_email.recorrencia_dias === 0) {
            return 'recorrência é dias zero e já teve envio';
        } else if (aviso_email.ultimo_envio_em && aviso_email.recorrencia_dias > 0) {
            const diffAsDay = DateTime.now().diff(DateTime.fromJSDate(aviso_email.ultimo_envio_em)).as('days');
            return `diferencia de dias é menor que recorrência: ${diffAsDay} < ${aviso_email.recorrencia_dias}`;
        }

        if (aviso_email.tipo == 'CronogramaTerminoPlanejado') {
            if (aviso_email.tarefa && aviso_email.tarefa.termino_real) {
                return 'tarefa tem término real';
            }

            if (aviso_email.tarefa_cronograma && aviso_email.tarefa_cronograma.realizado_termino) {
                return 'cronograma tem término real';
            }

            const dataTermPlanejado = this.resolveDataTermPlanejado(aviso_email);
            if (!dataTermPlanejado) return 'sem data de planejamento';
        }

        return '';
    }

    private geraMensagemEspera(dataTermPlanejado: Date, dataTermAviso: Date) {
        const dtPlan = DateTime.fromJSDate(dataTermPlanejado);
        const dtAviso = DateTime.fromJSDate(dataTermAviso);
        return `Data de termino previsto ${dtPlan.toISODate()} maior que data do aviso ${dtAviso.toISODate()}`;
    }

    outputToJson(executeOutput: any, _inputParams: any, _taskId: string): JSON {
        this.logger.verbose(JSON.stringify(executeOutput));
        return JSON.stringify(executeOutput) as any;
    }
}

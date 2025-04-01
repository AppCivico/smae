import { HttpException, Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { Prisma, task_queue, task_type } from '@prisma/client';
import { fork } from 'child_process';
import { DateTime } from 'luxon';
import { resolve as resolvePath } from 'path';
import { PessoaFromJwt } from '../auth/models/PessoaFromJwt';
import { CrontabIsEnabled } from '../common/CrontabIsEnabled';
import { TASK_JOB_LOCK_NUMBER } from '../common/dto/locks';
import { RecordWithId } from '../common/dto/record-with-id.dto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { EchoService } from './echo/echo.service';
import { TaskSingleDto, TaskableService } from './entities/task.entity';
import { RefreshMetaService } from './refresh_meta/refresh-meta.service';
import { RefreshMvService } from './refresh_mv/refresh-mv.service';
import { ParseParams } from './task.parseParams';
import { AvisoEmailTaskService } from './aviso_email/aviso_email.service';
import { AeCronogramaTpTaskService } from './aviso_email_cronograma_tp/ae_cronograma_tp.service';
import { AeNotaTaskService } from './aviso_email_nota/ae_nota.service';
import { RefreshTransferenciaService } from './refresh_transferencia/refresh-transferencia.service';
import { RefreshIndicadorService } from './refresh_indicador/refresh-indicador.service';
import { ImportacaoParlamentarService } from './importacao_parlamentar/parlamentar.service';
import { RefreshVariavelService } from './refresh_variavel/refresh-variavel.service';
import { RunReportTaskService } from './run_report/run-report.service';
function areJsonObjectsEquivalent(obj1: object, obj2: object): boolean {
    return JSON.stringify(sortObjectKeys(obj1)) === JSON.stringify(sortObjectKeys(obj2));
}

function sortObjectKeys(obj: object): object {
    if (typeof obj !== 'object' || obj === null) {
        return obj;
    }

    if (Array.isArray(obj)) {
        return obj.map(sortObjectKeys);
    }

    return Object.keys(obj)
        .sort()
        .reduce((result: { [key: string]: any }, key) => {
            result[key] = sortObjectKeys((obj as any)[key]);
            return result;
        }, {});
}

@Injectable()
export class TaskService {
    private enabled = false;
    private readonly logger = new Logger(TaskService.name);
    private current_jobs_pessoa_ids = new Set<number>();
    private current_jobs_types = new Set<task_type>();
    private running_jobs = new Set<number>();
    private running_job_counter = 0;
    private is_running = false;

    constructor(
        private readonly prisma: PrismaService,
        //
        @Inject(forwardRef(() => EchoService))
        private readonly echoService: EchoService,
        //
        @Inject(forwardRef(() => RefreshMvService))
        private readonly refreshMvService: RefreshMvService,
        //
        @Inject(forwardRef(() => RefreshMetaService))
        private readonly refreshMetaService: RefreshMetaService,
        //
        @Inject(forwardRef(() => RefreshVariavelService))
        private readonly refreshVariavel: RefreshVariavelService,
        //
        @Inject(forwardRef(() => RunReportTaskService))
        private readonly runReportService: RunReportTaskService,
        //
        @Inject(forwardRef(() => RefreshTransferenciaService))
        private readonly refreshTransferenciaService: RefreshTransferenciaService,
        //
        @Inject(forwardRef(() => AvisoEmailTaskService))
        private readonly avisoEmailTaskService: AvisoEmailTaskService,
        //
        @Inject(forwardRef(() => AeCronogramaTpTaskService))
        private readonly aeCronoTpService: AeCronogramaTpTaskService,
        //
        @Inject(forwardRef(() => AeNotaTaskService))
        private readonly aeNotaService: AeNotaTaskService,
        //
        @Inject(forwardRef(() => RefreshIndicadorService))
        private readonly refreshIndicadorService: RefreshIndicadorService,
        //
        @Inject(forwardRef(() => ImportacaoParlamentarService))
        private readonly importacaoParlamentarService: ImportacaoParlamentarService
    ) {
        this.enabled = CrontabIsEnabled('task');
        this.logger.debug(`task crontab enabled? ${this.enabled}`);
    }

    async create(
        dto: CreateTaskDto,
        user: PessoaFromJwt | null,
        transactionClient?: Prisma.TransactionClient
    ): Promise<RecordWithId> {
        // se tem user, nao é report, então verificar se tem já tem algo na fila
        // se tiver algo pendente, volta o mesmo ID
        if (user) {
            const existing = await this.prisma.task_queue.findFirst({
                where: {
                    status: { in: ['running', 'pending'] },
                    pessoa_id: user.id,
                    type: dto.type,
                },
            });

            if (
                existing &&
                existing.params?.valueOf() == 'object' &&
                areJsonObjectsEquivalent(JSON.parse(existing.params?.toString()), dto.params)
            )
                return { id: existing.id };
        }

        const performCreateTask = async (prismaTx: Prisma.TransactionClient): Promise<task_queue> => {
            return await prismaTx.task_queue.create({
                data: {
                    status: 'pending',
                    pessoa_id: user ? user.id : null,
                    type: dto.type,
                    params: dto.params,
                },
            });
        };

        let task: task_queue;

        if (transactionClient) {
            task = await performCreateTask(transactionClient);
        } else {
            task = await this.prisma.$transaction(
                async (prismaTx: Prisma.TransactionClient): Promise<task_queue> => {
                    return performCreateTask(prismaTx);
                },
                {
                    isolationLevel: 'ReadCommitted',
                    maxWait: 5000,
                    timeout: 5000,
                }
            );
        }

        return {
            id: task.id,
        };
    }

    async findOne(id: number, user: PessoaFromJwt): Promise<TaskSingleDto> {
        const r = await this.prisma.task_queue.findFirst({
            where: {
                pessoa_id: user.id,
                id: id,
            },
        });
        if (r === null) throw new HttpException('404', 404);

        return {
            id: r.id,
            tipo: r.type,
            params: r.params ? (r.params.valueOf() as any) : null,
            status: r.status,
            output: r.output ? (r.output.valueOf() as any) : null,
            criado_em: r.criado_em.toISOString(),
            iniciou_em: r.iniciou_em?.toISOString() ?? null,
            terminou_em: r.terminou_em?.toISOString() ?? null,
            erro_em: r.erro_em?.toISOString() ?? null,
            erro_mensagem: r.erro_mensagem,
        };
    }

    async runInFg(id: number, user: PessoaFromJwt | null): Promise<any> {
        const task = await this.prisma.task_queue.findFirst({
            where: {
                id: id,
            },
        });
        if (task === null) throw new HttpException('404', 404);

        try {
            const output = await this.startTaskInFg(task.id, task.type, task.params);
            // se for chamado pelo run-task.ts, retorna o json como string
            if (user === null) return output;

            const asObj = JSON.parse(output as any);
            // se o job não terminou com sucesso anteriormente, marca que foi executado
            if (task.status !== 'completed') {
                this.logger.log(`task ${task.id} completed`);

                await this.prisma.task_queue.update({
                    where: { id: task.id },
                    data: {
                        status: 'completed',
                        terminou_em: new Date(),
                        output: asObj,
                        erro_em: null,
                        erro_mensagem: null,
                    },
                });
            }

            return asObj;
        } catch (error) {
            this.logger.error(`run_in_fg errored: task-id: ${task.id}`);
            return { error: `${error}` };
        }
    }

    private async startTaskInFg(id: number, type: task_type, jsonParams: Prisma.JsonValue) {
        const params = jsonParams!.valueOf() as any;
        const output = await this.startJob(type, params, id.toString());
        return output;
    }

    @Interval(250)
    async handleCron() {
        if (!this.enabled) return;
        if (this.is_running) return;
        this.is_running = true;

        process.env.INTERNAL_DISABLE_QUERY_LOG = '1';
        await this.prisma.$transaction(
            async (prisma: Prisma.TransactionClient) => {
                const lockPromise: Promise<{ locked: boolean }[]> =
                    prisma.$queryRaw`SELECT pg_try_advisory_xact_lock(${TASK_JOB_LOCK_NUMBER}) as locked`;

                // Immediately set the INTERNAL_DISABLE_QUERY_LOG to ''
                lockPromise.then(() => {
                    process.env.INTERNAL_DISABLE_QUERY_LOG = '';
                });

                const locked = await lockPromise;
                if (!locked[0].locked) return;

                await this.startPendingJobs();

                await this.handleActiveJobs();
                await this.handleOldJobs();
                process.env.INTERNAL_DISABLE_QUERY_LOG = '1';
            },
            {
                maxWait: 15000,
                timeout: 60 * 1000,
                isolationLevel: 'ReadCommitted',
            }
        );
        process.env.INTERNAL_DISABLE_QUERY_LOG = '';
        this.is_running = false;
    }

    // each 1 hour
    @Interval(1000 * 60 * 60)
    async handleCronRemoveOld() {
        if (!this.enabled) return;
        // refresh que são mais volumosos, não compensa manter por mais de 1 dia
        await this.prisma.$queryRaw`
            DELETE FROM task_queue
            WHERE type::text LIKE 'refresh_%' AND status = 'completed'
            AND criado_em < NOW() - INTERVAL '1 day';
        `;
        // avisos também são relativamente constantes, mas não são tão volumosos
        await this.prisma.$queryRaw`
            DELETE FROM task_queue
            WHERE type::text LIKE 'aviso_%'
            AND status = 'completed'
            AND criado_em < NOW() - INTERVAL '6 months';
        `;
        // demais jobs, como importação parlamentar, relatórios, etc
        // são mais raros, então podem ficar por mais tempo
        // mas não compensa manter por mais de 1 ano
        await this.prisma.$queryRaw`
            DELETE FROM task_queue
            WHERE status = 'completed'
            AND criado_em < NOW() - INTERVAL '1 year';
        `;
    }

    async startPendingJobs() {
        process.env.INTERNAL_DISABLE_QUERY_LOG = '1';
        const pendingTasks = await this.prisma.task_queue.findMany({
            where: {
                status: 'pending',
                type: {
                    notIn: Array.from(this.current_jobs_types.values()),
                },
                pessoa_id: {
                    // pula quem ainda o job não terminou na org
                    notIn: Array.from(this.current_jobs_pessoa_ids.values()),
                },
            },
            take: 10,
            select: {
                id: true,
                type: true,
                params: true,
                pessoa_id: true,
            },
        });
        process.env.INTERNAL_DISABLE_QUERY_LOG = '';

        for (const task of pendingTasks) {
            // lock por quem colocou na fila
            if (task.pessoa_id && this.current_jobs_pessoa_ids.has(task.pessoa_id)) continue;
            if (task.pessoa_id) this.current_jobs_pessoa_ids.add(task.pessoa_id);
            // lock por tipo de job, os que são refresh geralmente podem cancelar mais de um job numa execução
            if (task.type.toString().startsWith('refresh_') && this.current_jobs_types.has(task.type)) continue;
            if (task.type.toString().startsWith('refresh_')) this.current_jobs_types.add(task.type);

            this.running_jobs.add(task.id);

            await this.prisma.task_queue.update({
                where: { id: task.id },
                data: { iniciou_em: new Date(), status: 'running', trabalhou_em: new Date() },
            });

            this.runJob(task.id, task.type, task.params)
                .then(async (output: JSON) => {
                    this.logger.log(`task ${task.id} completed`);

                    await this.prisma.task_queue.update({
                        where: { id: task.id },
                        data: {
                            status: 'completed',
                            terminou_em: new Date(),
                            output: JSON.parse(output as any),
                        },
                    });

                    if (task.pessoa_id) this.current_jobs_pessoa_ids.delete(task.pessoa_id);
                    if (task.type) this.current_jobs_types.delete(task.type);
                    this.running_jobs.delete(task.id);
                })
                .catch(async (e: any) => {
                    this.logger.error(`task ${task.id} failed`);
                    this.logger.error(e);

                    await this.prisma.task_queue.update({
                        where: { id: task.id },
                        data: {
                            status: 'errored',
                            erro_em: new Date(),
                            erro_mensagem: `${e}`,
                        },
                    });

                    if (task.pessoa_id) this.current_jobs_pessoa_ids.delete(task.pessoa_id);
                    if (task.type) this.current_jobs_types.delete(task.type);
                    this.running_jobs.delete(task.id);
                });
        }
    }

    async handleActiveJobs() {
        // 64 * 250 = 16s
        if (++this.running_job_counter % 64 !== 0) return;
        this.running_job_counter = 0;

        this.logger.debug(`Running HandleActiveJobs`);
        const now = new Date();
        process.env.INTERNAL_DISABLE_QUERY_LOG = '1';
        await this.prisma.$transaction([
            this.prisma.task_queue.updateMany({
                where: {
                    status: 'running',
                    id: { in: Array.from(this.running_jobs.values()) },
                    trabalhou_em: {
                        lte: DateTime.now().minus({ minute: 1 }).toJSDate(),
                    },
                },
                data: {
                    trabalhou_em: now,
                },
            }),
            this.prisma.task_queue.updateMany({
                where: {
                    status: 'running',
                    trabalhou_em: {
                        lte: DateTime.now().minus({ minute: 5 }).toJSDate(),
                    },
                },
                data: {
                    status: 'errored',
                    erro_mensagem: 'worked timed-out',
                },
            }),
        ]);
        process.env.INTERNAL_DISABLE_QUERY_LOG = '';
    }

    async handleOldJobs() {
        // 2400 * 250 = 10min
        if (++this.running_job_counter % 2400 !== 0) return;
        this.running_job_counter = 0;

        this.logger.debug(`Deleting completed jobs older than 1 day`);
        this.prisma.task_queue.deleteMany({
            where: {
                status: 'completed',
                criado_em: {
                    lte: DateTime.now().minus({ day: 1 }).toJSDate(),
                },
            },
        });
    }

    async runJob(taskId: number, type: task_type, params: Prisma.JsonValue): Promise<JSON> {
        try {
            const runInFg = this.shouldRunInForeground(type);
            if (runInFg) return await this.startTaskInFg(taskId, type, params);

            let result: JSON | undefined = undefined;
            let error: any | undefined = undefined;
            await new Promise<void>((resolve, reject) => {
                const child = fork(resolvePath(__dirname, './../bin/') + '/run-task.js', [taskId.toString()]);

                child.on('error', (err: any) => {
                    this.logger.error(`${taskId} errored ${err}`);
                });

                child.on('message', (msg: any) => {
                    if (msg.event == 'success') {
                        result = msg.result;
                    } else if (msg.event == 'error') {
                        error = msg.error;
                    }
                });

                child.on('exit', (code: number, signal: string) => {
                    if (error) reject(error);
                    if (result) resolve();

                    if (code !== null) reject(`process exited with code ${code}`);
                    if (signal !== null) reject(`process was killed with signal ${signal}`);
                });
            });

            if (!result) throw `process did not finished successfully, check logs`;

            return result;
        } catch (error) {
            this.logger.error(error);

            throw new Error(`executeJob failed: ${error}`);
        }
    }

    // jobs muito leves não compensa abrir um fork, roda no próprio worker
    private shouldRunInForeground(type: task_type): boolean {
        const map: Partial<Record<task_type, boolean>> = {
            run_report: false, // relatórios podem ser pesados, sempre rodar em um fork
            echo: true,
            refresh_mv: true, // só chama uma função no banco, n tem risco de leak
            refresh_meta: true, // tbm só chama função no banco
            refresh_indicador: true, // tbm só chama função no banco
            refresh_transferencia: true, // tbm só chama função no banco
            refresh_variavel: true, // tbm só chama função no banco
            aviso_email: true, // tbm só chama função no banco
            aviso_email_cronograma_tp: true, // tbm só chama função no banco
            aviso_email_nota: true, // tbm só chama função no banco
        };

        if (map[type]) return true;
        return false;
    }

    async startJob(type: task_type, params: string, task_id: string): Promise<JSON> {
        const service: TaskableService = this.serviceFromTaskType(type);

        const parsedParams = ParseParams(type, params);

        try {
            const result = await service.executeJob(parsedParams, task_id);

            return service.outputToJson(result, parsedParams, task_id);
        } catch (error) {
            this.logger.error(error);

            throw new Error(`executeJob failed: ${error}`);
        }
    }

    private serviceFromTaskType(task_type: task_type): TaskableService {
        let service: TaskableService | null = null;
        switch (task_type) {
            case 'echo':
                service = this.echoService;
                break;
            case 'refresh_mv':
                service = this.refreshMvService;
                break;
            case 'refresh_meta':
                service = this.refreshMetaService;
                break;
            case 'refresh_transferencia':
                service = this.refreshTransferenciaService;
                break;
            case 'aviso_email':
                service = this.avisoEmailTaskService;
                break;
            case 'aviso_email_cronograma_tp':
                service = this.aeCronoTpService;
                break;
            case 'aviso_email_nota':
                service = this.aeNotaService;
                break;
            case 'refresh_indicador':
                service = this.refreshIndicadorService;
                break;
            case 'importacao_parlamentar':
                service = this.importacaoParlamentarService;
                break;
            case 'refresh_variavel':
                service = this.refreshVariavel;
                break;
            case 'run_report':
                service = this.runReportService;
                break;
            default:
                task_type satisfies never;
        }

        if (!service) throw 'missing service @ serviceFromTaskType';
        return service;
    }
}

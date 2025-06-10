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
import { AvisoEmailTaskService } from './aviso_email/aviso_email.service';
import { AeCronogramaTpTaskService } from './aviso_email_cronograma_tp/ae_cronograma_tp.service';
import { AeNotaTaskService } from './aviso_email_nota/ae_nota.service';
import { CreateTaskDto, RetryConfigDto, RetryStrategy } from './dto/create-task.dto';
import { EchoService } from './echo/echo.service';
import { TaskSingleDto, TaskableService } from './entities/task.entity';
import { ImportacaoParlamentarService } from './importacao_parlamentar/parlamentar.service';
import { RefreshIndicadorService } from './refresh_indicador/refresh-indicador.service';
import { RefreshMetaService } from './refresh_meta/refresh-meta.service';
import { RefreshMvService } from './refresh_mv/refresh-mv.service';
import { RefreshTransferenciaService } from './refresh_transferencia/refresh-transferencia.service';
import { RefreshVariavelService } from './refresh_variavel/refresh-variavel.service';
import { RunReportTaskService } from './run_report/run-report.service';
import { RunUpdateTaskService } from './run_update/run-update.service';
import { ParseParams } from './task.parseParams';
import { TaskContext } from './task.context';
import { ApiLogBackupService } from 'src/api-logs/backup/api-log-backup.service';
import { ApiLogRestoreService } from 'src/api-logs/restore/api-log-restore.service';

export class TaskRetryService {
    static calculateNextRetryTime(retryCount: number, retryConfig: RetryConfigDto): Date {
        let delayMs: number;

        switch (retryConfig.strategy) {
            case RetryStrategy.FIXED:
                delayMs = retryConfig.baseDelayMs;
                break;
            case RetryStrategy.LINEAR:
                delayMs = retryConfig.baseDelayMs * (retryCount + 1);
                break;
            case RetryStrategy.EXPONENTIAL:
            default:
                delayMs = retryConfig.baseDelayMs * Math.pow(2, retryCount);
                break;
        }

        // Apply maximum delay constraint
        delayMs = Math.min(delayMs, retryConfig.maxDelayMs);

        // Calculate next retry time
        const nextRetryTime = new Date();
        nextRetryTime.setTime(nextRetryTime.getTime() + delayMs);

        return nextRetryTime;
    }

    // Check if error is retryable based on error message and configuration
    static isRetryableError(error: Error, retryConfig: RetryConfigDto): boolean {
        const errorMessage = error.message.toLowerCase();

        if (
            errorMessage.includes('timeout') ||
            errorMessage.includes('expirou') ||
            errorMessage.includes('processo expirou')
        ) {
            return true;
        }

        // Check against list of non-retryable errors
        for (const nonRetryableError of retryConfig.nonRetryableErrors) {
            if (errorMessage.includes(nonRetryableError.toLowerCase())) {
                return false;
            }
        }

        // Consider certain types of errors as non-retryable
        if (
            errorMessage.includes('permission denied') ||
            errorMessage.includes('invalid input') ||
            errorMessage.includes('bad request') ||
            errorMessage.includes('validation failed')
        ) {
            return false;
        }

        // todos os outros tenta de novo
        return true;
    }
}

type InfoWorker = {
    pid: number;
    hostname: string;
    startTime: string;
    isForeground: boolean;
    nodeVersion?: string;
    platform?: string;
    arch?: string;
    updatedAt?: string;
    memoriaUtilizada?: {
        heapTotal: number;
        heapUsed: number;
        rss: number;
    };
};

export function coletarInfoWorker(isForeground: boolean): InfoWorker {
    const hostname = process.env.HOSTNAME || 'desconhecido';
    return {
        pid: process.pid,
        hostname,
        startTime: new Date().toISOString(),
        isForeground,
        nodeVersion: process.version,
        platform: process.platform,
        arch: process.arch,
        memoriaUtilizada: process.memoryUsage(),
        updatedAt: new Date().toISOString(),
    };
}

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

    private max_concurrent_jobs = process.env.MAX_CONCURRENT_JOBS ? parseInt(process.env.MAX_CONCURRENT_JOBS) : 3;
    private current_concurrent_jobs = 0;

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
        private readonly importacaoParlamentarService: ImportacaoParlamentarService,
        //
        @Inject(forwardRef(() => RunUpdateTaskService))
        private readonly runUpdateTaskService: RunUpdateTaskService,
        //
        @Inject(forwardRef(() => ApiLogBackupService))
        private readonly apiLogBackupService: ApiLogBackupService,
        //
        @Inject(forwardRef(() => ApiLogRestoreService))
        private readonly apiLogRestoreService: ApiLogRestoreService
    ) {
        this.enabled = CrontabIsEnabled('task');
        this.logger.debug(`task crontab enabled? ${this.enabled}`);
    }

    // Método para lidar com o desligamento da aplicação
    async onApplicationShutdown(signal?: string) {
        this.logger.warn(`Sinal de desligamento recebido: ${signal}. Desabilitando crontab de tarefas.`);
        this.enabled = false;
        // Aguarda a finalização dos jobs
        while (this.current_concurrent_jobs > 0) {
            this.logger.warn(`Aguardando ${this.current_concurrent_jobs} jobs para finalizar`);
            await new Promise((resolve) => setTimeout(resolve, 1000));
        }
        this.logger.warn(`Todos os jobs foram finalizados. Saindo.`);
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
                orderBy: [{ erro_mensagem: { nulls: 'first', sort: 'desc' } }],
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
        // Novo: Adicione informações do worker
        const infoWorker = coletarInfoWorker(true);
        const params = jsonParams!.valueOf() as any;

        // Novo: Atualize a task com informações do worker
        await this.prisma.task_queue.update({
            where: { id },
            data: {
                worker_info: infoWorker,
            },
        });

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

    async startPendingJobs() {
        // Verifica se já atingiu o limite de jobs concorrentes
        if (this.current_concurrent_jobs >= this.max_concurrent_jobs) {
            return;
        }

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
                // Pega apenas o que não tem quando pra rodar, ou o que já passou do tempo
                OR: [
                    { esperar_ate: null }, //
                    { esperar_ate: { lte: new Date() } },
                ],
            },
            // Limita pela quantidade de jobs disponíveis
            take: this.max_concurrent_jobs - this.current_concurrent_jobs,
            // Ordenação para priorizar tarefas sem erro
            orderBy: [{ erro_mensagem: { nulls: 'first', sort: 'desc' } }, { criado_em: 'asc' }],
            select: {
                id: true,
                type: true,
                params: true,
                pessoa_id: true,
                n_retry: true,
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

            // Verifica o limite de concorrência
            if (this.current_concurrent_jobs >= this.max_concurrent_jobs) {
                break;
            }

            this.running_jobs.add(task.id);
            // Incrementa o contador de jobs concorrentes
            this.current_concurrent_jobs++;

            await this.prisma.task_queue.update({
                where: { id: task.id },
                data: {
                    iniciou_em: new Date(),
                    status: 'running',
                    trabalhou_em: new Date(),
                },
            });

            this.runJob(task.id, task.type, task.params, task.n_retry)
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
                    this.current_concurrent_jobs--;
                })
                .catch(async (e: any) => {
                    this.logger.error(`task ${task.id} failed`);
                    this.logger.error(e);

                    await this.prisma.$transaction(async (prismaTx: Prisma.TransactionClient): Promise<void> => {
                        await prismaTx.task_queue.update({
                            where: { id: task.id },
                            data: {
                                status: 'errored',
                                erro_em: new Date(),
                                erro_mensagem: `${e}`,
                            },
                        });

                        if (task.type == 'run_report') {
                            await this.runReportService.handleError(task.id, e, prismaTx);
                        }
                    });

                    if (task.pessoa_id) this.current_jobs_pessoa_ids.delete(task.pessoa_id);
                    if (task.type) this.current_jobs_types.delete(task.type);
                    this.running_jobs.delete(task.id);
                    this.current_concurrent_jobs--;
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

        // Atualiza trabalhou_em pra quem está rodando
        // da pra mover isso pra dentro do run-task.ts já que lá tem o app com o prisma todo,
        // dai a proxima linha faria mais sentindo, mas ao mesmo tempo o gerenciador do daemon aqui deveria ser
        // capaz de saber todos os estados do processo filho
        await this.prisma.task_queue.updateMany({
            where: {
                status: 'running',
                id: { in: Array.from(this.running_jobs.values()) },
                trabalhou_em: {
                    lte: DateTime.now().minus({ minute: 1 }).toJSDate(),
                },
            },
            data: { trabalhou_em: now },
        });

        const timedOutTasks = await this.prisma.task_queue.findMany({
            where: {
                status: 'running',
                trabalhou_em: {
                    lte: DateTime.now().minus({ minute: 5 }).toJSDate(),
                },
            },
            select: {
                id: true,
            },
        });

        for (const task of timedOutTasks) {
            await this.retryTimedOutTask(task.id, 'Processo expirou (timeout)');

            // Remove não faz sentindo, mas vai que a task tava rodando e não atualizou o status
            const taskInfo = await this.prisma.task_queue.findUnique({
                where: { id: task.id },
                select: { pessoa_id: true, type: true },
            });

            if (taskInfo) {
                if (taskInfo.pessoa_id) this.current_jobs_pessoa_ids.delete(taskInfo.pessoa_id);
                if (taskInfo.type) this.current_jobs_types.delete(taskInfo.type);
                this.running_jobs.delete(task.id);
                this.current_concurrent_jobs--;
            }
        }

        process.env.INTERNAL_DISABLE_QUERY_LOG = '';
    }

    async runJob(taskId: number, type: task_type, params: Prisma.JsonValue, currentRetryCount: number): Promise<JSON> {
        let lastError: Error | null = null;
        let retryCount = 0;
        const parsedParams = ParseParams(type, params);
        const retryConfig = parsedParams.retryConfig || new RetryConfigDto();
        try {
            if (currentRetryCount >= retryConfig.maxRetries)
                throw new Error(`Limite de tentativas excedido (${retryConfig.maxRetries})`);

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
                    if (msg.event === 'worker_info') {
                        // Atualiza as informações do worker com mais detalhes do processo filho
                        this.prisma.task_queue
                            .update({
                                where: { id: taskId },
                                data: {
                                    worker_info: msg.workerInfo,
                                },
                            })
                            .catch((err) => this.logger.error(`Falha ao atualizar worker_info: ${err}`));
                    } else if (msg.event == 'success') {
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

            if (retryCount > 0) {
                await this.prisma.task_queue.update({
                    where: { id: taskId },
                    data: { n_retry: 0 },
                });
            }

            return result;
        } catch (error) {
            this.logger.error(error);

            lastError = error instanceof Error ? error : new Error(String(error));
            if (!TaskRetryService.isRetryableError(lastError, retryConfig)) {
                this.logger.error(`erro não recuperável: ${lastError.message}`);
                throw lastError;
            }

            // Increment retry count
            retryCount++;
            const nextRetryTime = TaskRetryService.calculateNextRetryTime(retryCount, retryConfig);

            this.logger.log(
                `Task ${taskId} falhou, nova tentativa ${retryCount}/${retryConfig.maxRetries} em ${nextRetryTime.toISOString()}`
            );

            // Update database with retry information
            await this.prisma.task_queue.update({
                where: { id: taskId },
                data: {
                    status: 'pending',
                    n_retry: retryCount,
                    esperar_ate: nextRetryTime,
                },
            });

            throw new Error(
                `Retry ${retryCount}/${retryConfig.maxRetries}: ${lastError.message} Task terá nova tentativa em ${nextRetryTime.toISOString()}`
            );
        }
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

    // jobs muito leves não compensa abrir um fork, roda no próprio worker
    private shouldRunInForeground(type: task_type): boolean {
        const map: Partial<Record<task_type, boolean>> = {
            run_report: false, // relatórios podem ser pesados, sempre rodar em um fork
            run_update: false, // atualizações podem ser pesadas, sempre rodar em um fork
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
        const taskId = parseInt(task_id, 10);

        const context = new TaskContext(this.prisma, taskId, type);

        const parsedParams = ParseParams(type, params);

        try {
            const result = await service.executeJob(parsedParams, task_id, context);

            await context.removeStashedData().catch((e) => {
                this.logger.warn(`Failed to clean up task buffer for task ${task_id}: ${e}`);
            });

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
            case 'run_update':
                service = this.runUpdateTaskService;
                break;
            case 'backup_api_log_day':
                service = this.apiLogBackupService;
                break;
            case 'restore_api_log_day':
                service = this.apiLogRestoreService;
                break;
            default:
                task_type satisfies never;
        }

        if (!service) throw 'missing service @ serviceFromTaskType';
        return service;
    }

    async retryTimedOutTask(taskId: number, retryMessage: string) {
        const task = await this.prisma.task_queue.findUnique({
            where: { id: taskId },
        });

        if (!task) return;

        const parsedParams = ParseParams(task.type, task.params);
        const retryConfig = parsedParams.retryConfig || new RetryConfigDto();
        const retryCount = (task.n_retry || 0) + 1;

        // Check if we've reached max retries
        if (retryCount >= retryConfig.maxRetries) {
            await this.prisma.task_queue.update({
                where: { id: taskId },
                data: {
                    status: 'errored',
                    erro_mensagem: `Limite de tentativas excedido (${retryConfig.maxRetries}): ${retryMessage}`,
                },
            });
            return;
        }

        // Calculate next retry time
        const nextRetryTime = TaskRetryService.calculateNextRetryTime(retryCount, retryConfig);

        // Update task for retry
        await this.prisma.task_queue.update({
            where: { id: taskId },
            data: {
                status: 'pending',
                n_retry: retryCount,
                esperar_ate: nextRetryTime,
                erro_mensagem: `Retry ${retryCount}/${retryConfig.maxRetries}: ${retryMessage}`,
                erro_em: new Date(),
            },
        });

        this.logger.log(
            `Task ${taskId} timed out, scheduled retry ${retryCount}/${retryConfig.maxRetries} for ${nextRetryTime.toISOString()}`
        );
    }
}

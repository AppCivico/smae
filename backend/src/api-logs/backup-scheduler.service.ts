import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { task_type } from 'src/generated/prisma/client';
import { DateTime } from 'luxon';
import { SmaeConfigService } from 'src/common/services/smae-config.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskService } from 'src/task/task.service';
import { JOB_LOG_BACKUP_JOB_LOCK_NUMBER } from '../common/dto/locks';
import { IsCrontabDisabled } from '../common/crontab-utils';

@Injectable()
export class BackupSchedulerService {
    private readonly logger = new Logger('BackupSchedulerService');
    private is_running = false;

    constructor(
        private readonly prisma: PrismaService,
        private readonly taskService: TaskService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    @Cron(CronExpression.EVERY_HOUR)
    async handleApiLogBackupJob(): Promise<void> {
        if (IsCrontabDisabled('backup_scheduler')) return;
        if (this.is_running) return;
        this.is_running = true;

        process.env.INTERNAL_DISABLE_QUERY_LOG = '1';
        try {
            await this.prisma.$transaction(
                async (tx) => {
                    const lockPromise: Promise<{ locked: boolean }[]> =
                        tx.$queryRaw`SELECT pg_try_advisory_xact_lock(${JOB_LOG_BACKUP_JOB_LOCK_NUMBER}) as locked`;

                    // Immediately set the INTERNAL_DISABLE_QUERY_LOG to ''
                    lockPromise.then(() => {
                        process.env.INTERNAL_DISABLE_QUERY_LOG = '';
                    });

                    const locked = await lockPromise;
                    if (!locked[0].locked) return;

                    // --- Insert AWAITING_BACKUP for old logs ---
                    await this.scheduleApiLogBackupTasks(tx);
                },
                {
                    maxWait: 15000,
                    timeout: 60 * 1000,
                    isolationLevel: 'ReadCommitted',
                }
            );
        } finally {
            process.env.INTERNAL_DISABLE_QUERY_LOG = '';
            this.is_running = false;
        }
    }

    private async scheduleApiLogBackupTasks(
        tx: Omit<PrismaService, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use'>
    ) {
        await tx.apiRequestLogControl.updateMany({
            where: {
                status: 'BACKING_UP',
                task: {
                    status: { in: ['errored'] },
                },
            },
            data: {
                status: 'FAILED_BACKUP',
                last_error: 'Tarefa de backup anterior falhou ou não foi concluída.',
            },
        });

        const verificaExistente = await tx.apiRequestLogControl.count({
            where: {
                status: 'BACKING_UP',
            },
        });

        if (verificaExistente > 0) {
            this.logger.log(`Já existem ${verificaExistente} tarefas em BACKING_UP. Pulando processamento.`);
            return;
        }

        const retentionDays = await this.getApiLogRetentionDays();

        const now = DateTime.utc();
        const dataLimite = now.minus({ days: retentionDays }).startOf('day').toISODate();

        await tx.$executeRaw`
            WITH distinct_log_dates AS (
                SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC')::date AS log_date
                FROM api_request_log
                WHERE (created_at AT TIME ZONE 'UTC')::date < ${dataLimite}::date
            )
            INSERT INTO api_request_log_control (log_date, status, created_at, updated_at)
            SELECT dl.log_date, 'AWAITING_BACKUP', NOW(), NOW()
            FROM distinct_log_dates dl
            LEFT JOIN api_request_log_control arc ON dl.log_date = arc.log_date
            WHERE arc.log_date IS NULL;
        `;

        this.logger.log(`Registros de AWAITING_BACKUP inseridos até ${dataLimite}`);

        // --- Schedule backup tasks for AWAITING_BACKUP and FAILED_BACKUP ---
        const entradas = await tx.apiRequestLogControl.findMany({
            where: {
                status: { in: ['AWAITING_BACKUP', 'FAILED_BACKUP'] },
            },
            orderBy: { log_date: 'desc' },
            take: 1,
        });

        let count = 0;

        for (const entrada of entradas) {
            try {
                const task = await this.taskService.create(
                    {
                        type: task_type.backup_api_log_day,
                        params: {
                            date: entrada.log_date.toISOString().substring(0, 10),
                        },
                    },
                    null,
                    tx
                );

                await tx.apiRequestLogControl.update({
                    where: { log_date: entrada.log_date },
                    data: {
                        status: 'BACKING_UP',
                        task_id: task.id,
                    },
                });

                count++;
                this.logger.log(`${count} tarefas backup_api_log_day agendadas.`);
            } catch (error) {
                this.logger.error(`Erro ao criar task para ${entrada.log_date}: ${error.message}`, error.stack);
            }
        }
    }

    private async getApiLogRetentionDays() {
        const retentionDaysRaw = await this.smaeConfigService.getConfig('API_LOG_RETENTION_DAYS_HOT');
        let retentionDays = parseInt(retentionDaysRaw ?? '3');
        if (isNaN(retentionDays)) retentionDays = 3;
        return retentionDays;
    }
}

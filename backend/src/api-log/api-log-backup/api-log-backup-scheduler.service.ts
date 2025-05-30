import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { TaskService } from 'src/task/task.service';
import { SmaeConfigService } from 'src/common/services/smae-config.service';
import { task_type } from '@prisma/client';

@Injectable()
export class ApiLogBackupSchedulerService {
    private readonly logger = new Logger(ApiLogBackupSchedulerService.name);

    constructor(
        private readonly prisma: PrismaService,
        private readonly taskService: TaskService,
        private readonly smaeConfigService: SmaeConfigService
    ) {}

    @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
    async scheduleApiLogBackupTasks(): Promise<void> {
        if (process.env['DISABLE_API_LOG_BACKUP_CRONTAB']) return;

        const entradas = await this.prisma.apiRequestLogControl.findMany({
            where: {
                status: { in: ['AWAITING_BACKUP', 'FAILED_BACKUP'] },
            },
            orderBy: { log_date: 'asc' },
        });

        let count = 0;

        for (const entrada of entradas) {
            try {
                await this.prisma.$transaction(async (tx) => {
                    const task = await this.taskService.create(
                        {
                            type: task_type.backup_api_log_day,
                            params: {
                                date: entrada.log_date.toISOString().substring(0, 10),
                            },
                        },
                        null
                    );

                    await tx.apiRequestLogControl.update({
                        where: { log_date: entrada.log_date },
                        data: {
                            status: 'BACKING_UP',
                            task_id: task.id,
                        },
                    });

                    return task;
                });

                count++;
                this.logger.log(`[Scheduler] ${count} tarefas backup_api_log_day agendadas.`);
            } catch (error) {
                this.logger.error(`Erro ao criar task para ${entrada.log_date}: ${error.message}`, error.stack);
            }
        }
    }

    @Cron(CronExpression.EVERY_HOUR)
    async handleCreateAwaitingBackupTasks(): Promise<void> {
        if (process.env['DISABLE_API_LOG_BACKUP_CRONTAB']) return;

        const retentionDaysRaw = await this.smaeConfigService.getConfig('API_LOG_RETENTION_DAYS_HOT');
        let retentionDays = parseInt(retentionDaysRaw ?? '3');
        if (isNaN(retentionDays)) retentionDays = 3;

        const now = new Date();
        const dataLimiteUTC = new Date(
            Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - retentionDays, 0, 0, 0, 0)
        );
        const dataLimiteUTCString = dataLimiteUTC.toISOString().split('T')[0];

        const query = `
            WITH distinct_log_dates AS (
                SELECT DISTINCT DATE(created_at AT TIME ZONE 'UTC')::date AS log_date
                FROM api_request_log
                WHERE (created_at AT TIME ZONE 'UTC')::date < $1
            )
            INSERT INTO api_request_log_control (log_date, status, created_at, updated_at)
            SELECT dl.log_date, 'AWAITING_BACKUP', NOW(), NOW()
            FROM distinct_log_dates dl
            LEFT JOIN api_request_log_control arc ON dl.log_date = arc.log_date
            WHERE arc.log_date IS NULL;
        `;

        await this.prisma.$executeRawUnsafe(query, dataLimiteUTCString);

        this.logger.log(`[Scheduler] AWAITING_BACKUP inserted for logs before ${dataLimiteUTCString}`);
    }
}

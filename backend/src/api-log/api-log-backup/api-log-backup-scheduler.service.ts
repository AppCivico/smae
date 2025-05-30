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
    async handleApiLogBackupCron() {
        if (process.env['DISABLE_API_LOG_BACKUP_CRONTAB']) return;

        this.logger.log('Iniciando agendamento de backup para api_request_log...');

        try {
            let retentionDays = parseInt((await this.smaeConfigService.getConfig('API_LOG_RETENTION_DAYS_HOT')) ?? '3');
            if (isNaN(retentionDays)) retentionDays = 3;

            const now = new Date();

            const cutoffDate = new Date(
                Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - retentionDays, 0, 0, 0, 0)
            );

            const diasPendentes = await this.prisma.apiRequestLogControl.findMany({
                where: {
                    log_date: {
                        lt: cutoffDate,
                    },
                    status: 'AWAITING_BACKUP',
                },
            });

            for (const item of diasPendentes) {
                await this.taskService.create(
                    {
                        type: task_type.backup_api_log_day,
                        params: {
                            date: item.log_date.toISOString().split('T')[0],
                        },
                    },
                    null
                );
            }

            this.logger.log(`Backup agendado para ${diasPendentes.length} dias.`);
        } catch (error) {
            this.logger.error(`Erro ao agendar backup: ${error.message}`, error.stack);
        }
    }
}

import { forwardRef, Module } from '@nestjs/common';
import { DuckDBModule } from '../common/duckdb/duckdb.module';
import { SmaeConfigModule } from '../common/services/smae-config.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { TaskModule } from '../task/task.module';
import { ApiLogBackupService } from './backup/api-log-backup.service';
import { ApiLogBackupSchedulerService } from './backup/api-log-backup-scheduler.service';
import { ApiLogRestoreService } from './restore/api-log-restore.service';
import { ApiLogManagementController } from './restore/api-log-restore.controller';

@Module({
    imports: [DuckDBModule, SmaeConfigModule, PrismaModule, forwardRef(() => TaskModule)],
    providers: [ApiLogBackupService, ApiLogBackupSchedulerService, ApiLogRestoreService],
    controllers: [ApiLogManagementController],
    exports: [ApiLogBackupService, ApiLogRestoreService],
})
export class ApiLogModule {}

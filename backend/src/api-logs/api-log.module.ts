import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DuckDBModule } from '../common/duckdb/duckdb.module';
import { SmaeConfigModule } from '../common/services/smae-config.module';
import { TaskModule } from '../task/task.module';
import { BackupSchedulerService } from './backup-scheduler.service';
import { ApiLogBackupService } from './backup/api-log-backup.service';
import { ApiLogManagementController } from './restore/api-log-restore.controller';
import { ApiLogRestoreService } from './restore/api-log-restore.service';

@Module({
    imports: [DuckDBModule, SmaeConfigModule, PrismaModule, forwardRef(() => TaskModule)],
    providers: [ApiLogBackupService, BackupSchedulerService, ApiLogRestoreService],
    controllers: [ApiLogManagementController],
    exports: [ApiLogBackupService, ApiLogRestoreService],
})
export class ApiLogModule {}

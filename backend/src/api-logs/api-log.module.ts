import { forwardRef, Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DuckDBModule } from '../common/duckdb/duckdb.module';
import { TaskModule } from '../task/task.module';
import { BackupSchedulerService } from './backup-scheduler.service';
import { ApiLogBackupService } from './backup/api-log-backup.service';
import { ApiLogRestoreService } from './restore/api-log-restore.service';

@Module({
    imports: [DuckDBModule, PrismaModule, forwardRef(() => TaskModule)],
    providers: [ApiLogBackupService, BackupSchedulerService, ApiLogRestoreService],
    controllers: [],
    exports: [ApiLogBackupService, ApiLogRestoreService],
})
export class ApiLogModule {}

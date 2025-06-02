import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AvisoEmailTaskModule } from './aviso_email/aviso_email.module';
import { AeCronogramaTpModule } from './aviso_email_cronograma_tp/ae_cronograma_tp.module';
import { AeNotaModule } from './aviso_email_nota/ae_nota.module';
import { EchoModule } from './echo/echo.module';
import { RefreshIndicadorModule } from './refresh_indicador/refresh-indicador.module';
import { RefreshMetaModule } from './refresh_meta/refresh-meta.module';
import { RefreshMvModule } from './refresh_mv/refresh-mv.module';
import { RefreshTransferenciaModule } from './refresh_transferencia/refresh-transferencia.module';
import { TaskController } from './task.controller';
import { TaskService } from './task.service';
import { ImportacaoParlamentarModule } from './importacao_parlamentar/parlamentar.module';
import { RefreshVariavelModule } from './refresh_variavel/refresh-variavel.module';
import { RunReportModule } from './run_report/run-report.module';
import { RunUpdateModule } from './run_update/run-update.module';
import { ApiLogBackupService } from 'src/api-logs/backup/api-log-backup.service';
import { ApiLogRestoreService } from 'src/api-logs/restore/api-log-restore.service';
import { SmaeConfigModule } from 'src/common/services/smae-config.module';
import { DuckDBModule } from 'src/common/duckdb/duckdb.module';
import { ApiLogManagementController } from 'src/api-logs/restore/api-log-restore.controller';

@Module({
    imports: [
        PrismaModule,
        SmaeConfigModule,
        DuckDBModule,
        forwardRef(() => EchoModule),
        forwardRef(() => RefreshMvModule),
        forwardRef(() => RefreshMetaModule),
        forwardRef(() => RefreshIndicadorModule),
        forwardRef(() => AvisoEmailTaskModule),
        forwardRef(() => AeCronogramaTpModule),
        forwardRef(() => AeNotaModule),
        forwardRef(() => RefreshTransferenciaModule),
        forwardRef(() => ImportacaoParlamentarModule),
        forwardRef(() => RunReportModule),
        forwardRef(() => RefreshVariavelModule),
        forwardRef(() => RunUpdateModule),
    ],
    controllers: [TaskController, ApiLogManagementController],
    providers: [TaskService, ApiLogBackupService, ApiLogRestoreService],
    exports: [TaskService],
})
export class TaskModule {}

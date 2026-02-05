import { Module } from '@nestjs/common';
import { RunReportModule } from './task/run_report/run-report.module';
import { RunUpdateModule } from './task/run_update/run-update.module';
import { TaskModule } from './task/task.module';
import { AeCronogramaTpModule } from './task/aviso_email_cronograma_tp/ae_cronograma_tp.module';
import { AeNotaModule } from './task/aviso_email_nota/ae_nota.module';
import { AvisoEmailTaskModule } from './task/aviso_email/aviso_email.module';
import { EchoModule } from './task/echo/echo.module';
import { ImportacaoParlamentarModule } from './task/importacao_parlamentar/parlamentar.module';
import { RefreshDemandaModule } from './task/refresh_demanda/refresh-demanda.module';
import { RefreshIndicadorModule } from './task/refresh_indicador/refresh-indicador.module';
import { RefreshMetaModule } from './task/refresh_meta/refresh-meta.module';
import { RefreshMvModule } from './task/refresh_mv/refresh-mv.module';
import { RefreshTransferenciaModule } from './task/refresh_transferencia/refresh-transferencia.module';
import { RefreshVariavelModule } from './task/refresh_variavel/refresh-variavel.module';

/**
 * Task modules aggregation
 * Consolidates all background task and scheduled job modules:
 * - Task scheduling and orchestration
 * - Report generation tasks
 * - Refresh tasks (variables, indicators, meta, etc.)
 * - Email notification tasks
 * - Data import tasks
 */
@Module({
    imports: [
        TaskModule,
        RunReportModule,
        RunUpdateModule,
        RefreshVariavelModule,
        RefreshMetaModule,
        RefreshIndicadorModule,
        RefreshDemandaModule,
        RefreshTransferenciaModule,
        RefreshMvModule,
        AvisoEmailTaskModule,
        AeCronogramaTpModule,
        AeNotaModule,
        ImportacaoParlamentarModule,
        EchoModule,
    ],
})
export class AppModuleTasks {}

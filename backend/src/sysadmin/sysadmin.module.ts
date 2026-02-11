import { Module } from '@nestjs/common';
import { ApiLogModule } from '../api-logs/api-log.module';
import { AtualizacaoEmLoteModule } from '../atualizacao-em-lote/atualizacao-em-lote.module';
import { ReportsModule } from '../reports/relatorios/reports.module';
import { TaskModule } from '../task/task.module';
import { TransfereGovSyncModule } from '../transfere-gov-sync/transfere-gov-sync.module';
import { UploadModule } from '../upload/upload.module';
import { SysadminController } from './sysadmin.controller';

/**
 * Módulo de operações administrativas do sistema
 * Centraliza endpoints de reprocessamento, sincronização e restauração
 */
@Module({
    imports: [UploadModule, TaskModule, TransfereGovSyncModule, ApiLogModule, ReportsModule, AtualizacaoEmLoteModule],
    controllers: [SysadminController],
})
export class SysadminModule {}

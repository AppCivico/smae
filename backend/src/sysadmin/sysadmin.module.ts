import { Module, forwardRef } from '@nestjs/common';
import { SysadminController } from './sysadmin.controller';
import { UploadModule } from '../upload/upload.module';
import { TaskModule } from '../task/task.module';
import { TransfereGovSyncModule } from '../transfere-gov-sync/transfere-gov-sync.module';
import { ApiLogModule } from '../api-logs/api-log.module';
import { ReportsModule } from '../reports/relatorios/reports.module';
import { AtualizacaoEmLoteModule } from '../atualizacao-em-lote/atualizacao-em-lote.module';

/**
 * Módulo de operações administrativas do sistema
 * Centraliza endpoints de reprocessamento, sincronização e restauração
 */
@Module({
  imports: [
    forwardRef(() => UploadModule),
    forwardRef(() => TaskModule),
    forwardRef(() => TransfereGovSyncModule),
    forwardRef(() => ApiLogModule),
    forwardRef(() => ReportsModule),
    forwardRef(() => AtualizacaoEmLoteModule),
  ],
  controllers: [SysadminController],
})
export class SysadminModule {}

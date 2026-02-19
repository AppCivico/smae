import { Module } from '@nestjs/common';
import { ApiLogModule } from '../api-logs/api-log.module';
import { AtualizacaoEmLoteModule } from '../atualizacao-em-lote/atualizacao-em-lote.module';
import { ReportsModule } from '../reports/relatorios/reports.module';
import { TaskModule } from '../task/task.module';
import { TransfereGovSyncModule } from '../transfere-gov-sync/transfere-gov-sync.module';
import { UploadModule } from '../upload/upload.module';
import { SysadminDemandaController } from './controllers/demanda.controller';
import { SysadminUploadController } from './controllers/upload.controller';
import { SysadminTransfereGovController } from './controllers/transfere-gov.controller';
import { SysadminLogsController } from './controllers/logs.controller';
import { SysadminRelatoriosController } from './controllers/relatorios.controller';
import { SysadminAtualizacaoController } from './controllers/atualizacao.controller';

export const API_TAG = 'SysAdmin - Operações de Reprocessamento e Sincronização';

/**
 * Módulo de operações administrativas do sistema
 * Centraliza endpoints de reprocessamento, sincronização e restauração
 */
@Module({
    imports: [UploadModule, TaskModule, TransfereGovSyncModule, ApiLogModule, ReportsModule, AtualizacaoEmLoteModule],
    controllers: [
        SysadminDemandaController,
        SysadminUploadController,
        SysadminTransfereGovController,
        SysadminLogsController,
        SysadminRelatoriosController,
        SysadminAtualizacaoController,
    ],
})
export class SysadminModule {}

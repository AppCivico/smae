import { Module } from '@nestjs/common';
import { ApiLogModule } from '../api-logs/api-log.module';
import { AtualizacaoEmLoteModule } from '../atualizacao-em-lote/atualizacao-em-lote.module';
import { EquipeRespModule } from '../equipe-resp/equipe-resp.module';
import { ReportsModule } from '../reports/relatorios/reports.module';
import { TaskModule } from '../task/task.module';
import { TransfereGovSyncModule } from '../transfere-gov-sync/transfere-gov-sync.module';
import { UploadModule } from '../upload/upload.module';
import { SysadminAtualizacaoController } from './controllers/atualizacao.controller';
import { SysadminDemandaController } from './controllers/demanda.controller';
import { SysadminEquipeRespController } from './controllers/equipe-resp.controller';
import { SysadminLogsController } from './controllers/logs.controller';
import { SysadminRelatoriosController } from './controllers/relatorios.controller';
import { SysadminTransfereGovController } from './controllers/transfere-gov.controller';
import { SysadminUploadController } from './controllers/upload.controller';

export const API_TAG = 'SysAdmin - Operações de Reprocessamento e Sincronização';

/**
 * Módulo de operações administrativas do sistema
 * Centraliza endpoints de reprocessamento, sincronização e restauração
 */
@Module({
    imports: [
        UploadModule,
        TaskModule,
        TransfereGovSyncModule,
        ApiLogModule,
        ReportsModule,
        AtualizacaoEmLoteModule,
        EquipeRespModule,
    ],
    controllers: [
        SysadminDemandaController,
        SysadminUploadController,
        SysadminTransfereGovController,
        SysadminLogsController,
        SysadminRelatoriosController,
        SysadminAtualizacaoController,
        SysadminEquipeRespController,
    ],
})
export class SysadminModule {}

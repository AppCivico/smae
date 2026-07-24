import { Module } from '@nestjs/common';
import { ReportPostProcessService } from './report-post-process.service';

/**
 * Módulo do pós-processamento de relatórios.
 *
 * Deliberadamente sem dependências (nem PrismaModule): o `ReportPostProcessService` só
 * trabalha com arquivos locais e DuckDB. Isso mantém o grafo acíclico — o `ReportsModule`
 * importa este, e nunca o contrário.
 */
@Module({
    providers: [ReportPostProcessService],
    exports: [ReportPostProcessService],
})
export class ReportPostProcessModule {}

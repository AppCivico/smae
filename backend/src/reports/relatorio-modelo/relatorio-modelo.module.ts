import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RelatorioModeloController } from './relatorio-modelo.controller';
import { RelatorioModeloService } from './relatorio-modelo.service';

/**
 * CRUD dos modelos (templates) de saída de relatório + descoberta de colunas.
 *
 * Sem dependência do `ReportsModule`: a descoberta de colunas vem do registro de decoradores
 * (`@ReportRows`/`@ReportColumn`), que é estático, e a autorização usa apenas os privilégios do
 * JWT. Assim o grafo segue acíclico.
 */
@Module({
    imports: [PrismaModule],
    controllers: [RelatorioModeloController],
    providers: [RelatorioModeloService],
    exports: [RelatorioModeloService],
})
export class RelatorioModeloModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { RefreshMetaOrcamentoConsolidadoService } from './refresh-meta-orcamento-consolidado.service';

@Module({
    imports: [PrismaModule],
    providers: [RefreshMetaOrcamentoConsolidadoService],
    exports: [RefreshMetaOrcamentoConsolidadoService],
})
export class RefreshMetaOrcamentoConsolidadoModule {}

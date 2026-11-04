import { Module } from '@nestjs/common';
import { DotacaoModule } from '../../dotacao/dotacao.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { TransferenciasOrcamentoController } from './transferencias-orcamento.controller';
import { TransferenciasOrcamentoService } from './transferencias-orcamento.service';

@Module({
    imports: [PrismaModule, DotacaoModule],
    controllers: [TransferenciasOrcamentoController],
    providers: [TransferenciasOrcamentoService],
    exports: [TransferenciasOrcamentoService],
})
export class TransferenciasOrcamentoModule {}

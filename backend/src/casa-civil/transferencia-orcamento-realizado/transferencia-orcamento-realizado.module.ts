import { forwardRef, Module } from '@nestjs/common';
import { DotacaoModule } from '../../dotacao/dotacao.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { TransferenciaModule } from '../transferencia/transferencia.module';
import { VinculoModule } from '../vinculo/vinculo.module';
import { TransferenciaOrcamentoRealizadoController } from './transferencia-orcamento-realizado.controller';
import { TransferenciaOrcamentoRealizadoService } from './transferencia-orcamento-realizado.service';

@Module({
    imports: [PrismaModule, DotacaoModule, TransferenciaModule, forwardRef(() => VinculoModule)],
    controllers: [TransferenciaOrcamentoRealizadoController],
    providers: [TransferenciaOrcamentoRealizadoService],
})
export class TransferenciaOrcamentoRealizadoModule {}

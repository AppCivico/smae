import { Module } from '@nestjs/common';
import { DotacaoModule } from '../dotacao/dotacao.module';
import { OrcamentoPlanejadoModule } from '../orcamento-planejado/orcamento-planejado.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrcamentoRealizadoController, OrcamentoRealizadoPSController } from './orcamento-realizado.controller';
import { OrcamentoRealizadoService } from './orcamento-realizado.service';

@Module({
    imports: [PrismaModule, DotacaoModule, OrcamentoPlanejadoModule],
    controllers: [OrcamentoRealizadoController, OrcamentoRealizadoPSController],
    providers: [OrcamentoRealizadoService],
    exports: [OrcamentoRealizadoService],
})
export class OrcamentoRealizadoModule {}

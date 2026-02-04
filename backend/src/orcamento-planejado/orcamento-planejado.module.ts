import { Module } from '@nestjs/common';
import { DotacaoModule } from '../dotacao/dotacao.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrcamentoPlanejadoController, OrcamentoPlanejadoPSController } from './orcamento-planejado.controller';
import { OrcamentoPlanejadoService } from './orcamento-planejado.service';

@Module({
    imports: [PrismaModule, DotacaoModule],
    controllers: [OrcamentoPlanejadoController, OrcamentoPlanejadoPSController],
    providers: [OrcamentoPlanejadoService],
    exports: [OrcamentoPlanejadoService],
})
export class OrcamentoPlanejadoModule {}

import { Module } from '@nestjs/common';
import { OrcamentoPlanejadoService } from './orcamento-planejado.service';
import { OrcamentoPlanejadoController } from './orcamento-planejado.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { DotacaoModule } from '../dotacao/dotacao.module';

@Module({
    imports: [PrismaModule, DotacaoModule],
    controllers: [OrcamentoPlanejadoController],
    providers: [OrcamentoPlanejadoService],
    exports: [OrcamentoPlanejadoService],
})
export class OrcamentoPlanejadoModule {}

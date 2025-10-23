import { Module } from '@nestjs/common';
import { DotacaoModule } from '../dotacao/dotacao.module';
import { PrismaModule } from '../prisma/prisma.module';
import { OrcamentoPlanejadoController, OrcamentoPlanejadoPSController } from './orcamento-planejado.controller';
import { OrcamentoPlanejadoService } from './orcamento-planejado.service';
import { VinculoModule } from 'src/casa-civil/vinculo/vinculo.module';

@Module({
    imports: [PrismaModule, DotacaoModule, VinculoModule],
    controllers: [OrcamentoPlanejadoController, OrcamentoPlanejadoPSController],
    providers: [OrcamentoPlanejadoService],
    exports: [OrcamentoPlanejadoService],
})
export class OrcamentoPlanejadoModule {}

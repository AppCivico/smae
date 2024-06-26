import { Module } from '@nestjs/common';
import { OrcamentoPlanejadoService } from './orcamento-planejado.service';
import { OrcamentoPlanejadoController, OrcamentoPlanejadoMDOController } from './orcamento-planejado.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { DotacaoModule } from '../../dotacao/dotacao.module';

@Module({
    imports: [PrismaModule, DotacaoModule, ProjetoModule],
    controllers: [OrcamentoPlanejadoController, OrcamentoPlanejadoMDOController],
    providers: [OrcamentoPlanejadoService],
})
export class OrcamentoPlanejadoModule {}

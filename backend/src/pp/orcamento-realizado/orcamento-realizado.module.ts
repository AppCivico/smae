import { Module, forwardRef } from '@nestjs/common';
import { DotacaoModule } from '../../dotacao/dotacao.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { ProjetoModule } from '../projeto/projeto.module';
import { OrcamentoRealizadoController, OrcamentoRealizadoMDOController } from './orcamento-realizado.controller';
import { OrcamentoRealizadoService } from './orcamento-realizado.service';
import { VinculoModule } from 'src/casa-civil/vinculo/vinculo.module';

@Module({
    imports: [PrismaModule, DotacaoModule, ProjetoModule, forwardRef(() => VinculoModule)],
    controllers: [OrcamentoRealizadoController, OrcamentoRealizadoMDOController],
    providers: [OrcamentoRealizadoService],
    exports: [OrcamentoRealizadoService],
})
export class OrcamentoRealizadoModule {}

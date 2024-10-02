import { Module } from '@nestjs/common';
import { DotacaoModule } from '../../dotacao/dotacao.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { PrevisaoCustoModule } from '../previsao-custo/previsao-custo.module';
import { UtilsService } from '../utils/utils.service';
import { OrcamentoController, PSOrcamentoController } from './orcamento.controller';
import { OrcamentoService } from './orcamento.service';

@Module({
    imports: [PrismaModule, DotacaoModule, PrevisaoCustoModule],
    controllers: [OrcamentoController, PSOrcamentoController],
    providers: [OrcamentoService, UtilsService],
    exports: [OrcamentoService],
})
export class OrcamentoModule {}

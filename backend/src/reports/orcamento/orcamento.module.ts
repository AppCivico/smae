import { Module } from '@nestjs/common';
import { OrcamentoService } from './orcamento.service';
import { OrcamentoController } from './orcamento.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { DotacaoModule } from '../../dotacao/dotacao.module';
import { PrevisaoCustoModule } from '../previsao-custo/previsao-custo.module';

@Module({
    imports: [
        PrismaModule,
        DotacaoModule,
        PrevisaoCustoModule
    ],
    controllers: [OrcamentoController],
    providers: [
        OrcamentoService,
        UtilsService,
    ],
    exports: [OrcamentoService],
})
export class OrcamentoModule { }

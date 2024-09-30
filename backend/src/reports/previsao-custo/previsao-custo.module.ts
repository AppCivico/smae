import { Module } from '@nestjs/common';
import { DotacaoModule } from 'src/dotacao/dotacao.module';
import { MetaOrcamentoModule } from 'src/meta-orcamento/meta-orcamento.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { PrevisaoCustoController, PSPrevisaoCustoController } from './previsao-custo.controller';
import { PrevisaoCustoService } from './previsao-custo.service';

@Module({
    imports: [PrismaModule, MetaOrcamentoModule, DotacaoModule],
    controllers: [PrevisaoCustoController, PSPrevisaoCustoController],
    providers: [PrevisaoCustoService, UtilsService],
    exports: [PrevisaoCustoService],
})
export class PrevisaoCustoModule {}

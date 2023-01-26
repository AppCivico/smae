import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { MetaOrcamentoModule } from 'src/meta-orcamento/meta-orcamento.module';
import { PrevisaoCustoController } from './previsao-custo.controller';
import { PrevisaoCustoService } from './previsao-custo.service';
import { DotacaoModule } from 'src/dotacao/dotacao.module';

@Module({
    imports: [PrismaModule, MetaOrcamentoModule, DotacaoModule],
    controllers: [PrevisaoCustoController],
    providers: [PrevisaoCustoService, UtilsService],
    exports: [PrevisaoCustoService]
})

export class PrevisaoCustoModule { }

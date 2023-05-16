import { Module } from '@nestjs/common';
import { DotacaoModule } from 'src/dotacao/dotacao.module';
import { MetaOrcamentoModule } from 'src/meta-orcamento/meta-orcamento.module';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { ProjetoPrevisaoCustoController } from './projeto-previsao-custo.controller';
import { PrevisaoCustoModule } from '../previsao-custo/previsao-custo.module';

@Module({
    imports: [PrismaModule, MetaOrcamentoModule, DotacaoModule, PrevisaoCustoModule],
    controllers: [ProjetoPrevisaoCustoController],
    providers: [UtilsService],
})
export class ProjetoPrevisaoCustoModule { }

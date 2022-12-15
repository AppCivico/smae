import { Module } from '@nestjs/common';
import { DotacaoModule } from '../dotacao/dotacao.module';
import { OrcamentoPlanejadoModule } from '../orcamento-planejado/orcamento-planejado.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MetaOrcamentoController } from './meta-orcamento.controller';
import { MetaOrcamentoService } from './meta-orcamento.service';

@Module({
    imports: [PrismaModule, OrcamentoPlanejadoModule, DotacaoModule],
    controllers: [MetaOrcamentoController],
    providers: [MetaOrcamentoService],
})
export class MetaOrcamentoModule { }

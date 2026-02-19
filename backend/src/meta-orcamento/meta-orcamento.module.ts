import { Module, forwardRef } from '@nestjs/common';
import { DotacaoModule } from '../dotacao/dotacao.module';
import { OrcamentoPlanejadoModule } from '../orcamento-planejado/orcamento-planejado.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MetaOrcamentoController, MetaPSOrcamentoController } from './meta-orcamento.controller';
import { MetaOrcamentoService } from './meta-orcamento.service';

@Module({
    imports: [PrismaModule, forwardRef(() => OrcamentoPlanejadoModule), DotacaoModule],
    controllers: [MetaOrcamentoController, MetaPSOrcamentoController],
    providers: [MetaOrcamentoService],
})
export class MetaOrcamentoModule {}

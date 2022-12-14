import { Module } from '@nestjs/common';
import { MetaOrcamentoService } from './meta-orcamento.service';
import { MetaOrcamentoController } from './meta-orcamento.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { OrcamentoPlanejadoModule } from '../orcamento-planejado/orcamento-planejado.module';

@Module({
    imports: [PrismaModule, OrcamentoPlanejadoModule],
    controllers: [MetaOrcamentoController],
    providers: [MetaOrcamentoService]
})
export class MetaOrcamentoModule { }

import { Module } from '@nestjs/common';
import { OrcamentoPrevistoService } from './orcamento-previsto.service';
import { OrcamentoPrevistoController } from './orcamento-previsto.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { DotacaoModule } from '../../dotacao/dotacao.module';
import { ProjetoModule } from '../projeto/projeto.module';

@Module({
    imports: [PrismaModule, DotacaoModule, ProjetoModule],
    controllers: [OrcamentoPrevistoController],
    providers: [OrcamentoPrevistoService],
})
export class OrcamentoPrevistoModule {}

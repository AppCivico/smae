import { Module } from '@nestjs/common';
import { OrcamentoExecutadoService } from './orcamento-executado.service';
import { OrcamentoExecutadoController } from './orcamento-executado.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { DotacaoModule } from '../../dotacao/dotacao.module';

@Module({
    imports: [PrismaModule, DotacaoModule],
    controllers: [OrcamentoExecutadoController],
    providers: [OrcamentoExecutadoService, UtilsService],
})
export class OrcamentoExecutadoModule { }

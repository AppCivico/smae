import { Module } from '@nestjs/common';
import { OrcamentoService } from './orcamento.service';
import { OrcamentoController } from './orcamento.controller';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { DotacaoModule } from '../../dotacao/dotacao.module';

@Module({
    imports: [PrismaModule, DotacaoModule],
    controllers: [OrcamentoController],
    providers: [OrcamentoService, UtilsService],
})
export class OrcamentoModule { }

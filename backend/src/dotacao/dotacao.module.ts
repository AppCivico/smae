import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { SofApiModule } from '../sof-api/sof-api.module';
import { DotacaoProcessoNotaService } from './dotacao-processo-nota.service';
import { DotacaoProcessoService } from './dotacao-processo.service';
import { DotacaoController } from './dotacao.controller';
import { DotacaoService } from './dotacao.service';

@Module({
    imports: [PrismaModule, SofApiModule],
    controllers: [DotacaoController],
    providers: [DotacaoService, DotacaoProcessoService, DotacaoProcessoNotaService],
    exports: [DotacaoService],
})
export class DotacaoModule {}

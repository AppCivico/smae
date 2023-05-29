import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ImportacaoOrcamentoController } from './importacao-orcamento.controller';
import { ImportacaoOrcamentoService } from './importacao-orcamento.service';

import { OrcamentoRealizadoModule as PdmOrcamentoRealizadoModule } from 'src/orcamento-realizado/orcamento-realizado.module';
import { OrcamentoRealizadoModule as ProjetoOrcamentoRealizadoModule } from 'src/pp/orcamento-realizado/orcamento-realizado.module';
import { DotacaoModule } from 'src/dotacao/dotacao.module';
import { UploadModule } from 'src/upload/upload.module';

@Module({
    imports: [
        PrismaModule,
        DotacaoModule,
        UploadModule,
        forwardRef(() => ProjetoOrcamentoRealizadoModule),
        forwardRef(() => PdmOrcamentoRealizadoModule),
    ],
    controllers: [ImportacaoOrcamentoController],
    providers: [ImportacaoOrcamentoService]
})
export class ImportacaoOrcamentoModule { }

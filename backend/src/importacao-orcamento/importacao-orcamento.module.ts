import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ImportacaoOrcamentoController } from './importacao-orcamento.controller';
import { ImportacaoOrcamentoService } from './importacao-orcamento.service';

import { OrcamentoRealizadoModule as PdmOrcamentoRealizadoModule } from 'src/orcamento-realizado/orcamento-realizado.module';
import { OrcamentoRealizadoModule as ProjetoOrcamentoRealizadoModule } from 'src/pp/orcamento-realizado/orcamento-realizado.module';
import { DotacaoModule } from 'src/dotacao/dotacao.module';
import { UploadModule } from 'src/upload/upload.module';
import { ProjetoModule } from 'src/pp/projeto/projeto.module';
import { MetaModule } from 'src/meta/meta.module';

@Module({
    imports: [
        PrismaModule,
        DotacaoModule,
        UploadModule,
        forwardRef(() => ProjetoModule),
        forwardRef(() => MetaModule),
        forwardRef(() => ProjetoOrcamentoRealizadoModule),
        forwardRef(() => PdmOrcamentoRealizadoModule),
    ],
    controllers: [ImportacaoOrcamentoController],
    providers: [ImportacaoOrcamentoService]
})
export class ImportacaoOrcamentoModule { }

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
import { AuthModule } from 'src/auth/auth.module';
import { JwtModule } from '@nestjs/jwt';

@Module({
    imports: [
        PrismaModule,
        DotacaoModule,
        UploadModule,
        forwardRef(() => AuthModule),
        forwardRef(() => ProjetoModule),
        forwardRef(() => MetaModule),
        forwardRef(() => ProjetoOrcamentoRealizadoModule),
        forwardRef(() => PdmOrcamentoRealizadoModule),
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [ImportacaoOrcamentoController],
    providers: [ImportacaoOrcamentoService],
})
export class ImportacaoOrcamentoModule {}

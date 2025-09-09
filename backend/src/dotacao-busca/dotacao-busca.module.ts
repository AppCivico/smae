import { Module } from '@nestjs/common';
import { DotacaoBuscaController } from './dotacao-busca.controller';
import { DotacaoBuscaService } from './dotacao-busca.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { DotacaoModule } from 'src/dotacao/dotacao.module';
import { SofApiModule } from 'src/sof-api/sof-api.module';

@Module({
    controllers: [DotacaoBuscaController],
    providers: [DotacaoBuscaService],
    imports: [PrismaModule, DotacaoModule, SofApiModule],
    exports: [DotacaoBuscaService],
})
export class DotacaoBuscaModule {}

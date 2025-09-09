import { Module } from '@nestjs/common';
import { DotacaoBuscaController } from './dotacao-busca.controller';
import { DotacaoBuscaService } from './dotacao-busca.service';
import { PrismaService } from '../prisma/prisma.service';
import { DotacaoService } from 'src/dotacao/dotacao.service';
import { SofApiService } from 'src/sof-api/sof-api.service';

@Module({
  controllers: [DotacaoBuscaController],
  providers: [DotacaoBuscaService, PrismaService, DotacaoService, SofApiService],
})
export class DotacaoBuscaModule {}

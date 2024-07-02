import { Module } from '@nestjs/common';
import { ProjetoModalidadeContratacaoService } from './mod-contratacao.service';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ProjetoModalidadeContratacaoController } from './mod-contratacao.controller';

@Module({
    imports: [PrismaModule],
    controllers: [ProjetoModalidadeContratacaoController],
    providers: [ProjetoModalidadeContratacaoService],
})
export class ProjetoModalidadeContratacaoModule {}

import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { ProjetoModule } from '../projeto.module';
import { AcaoController } from './acao.controller';
import { AcaoService } from './acao.service';

@Module({
    imports: [PrismaModule, ProjetoModule],
    controllers: [AcaoController],
    providers: [AcaoService],
})
export class AcaoModule { }

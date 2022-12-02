import { Module } from '@nestjs/common';
import { DotacaoService } from './dotacao.service';
import { DotacaoController } from './dotacao.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { SofApiModule } from '../sof-api/sof-api.module';

@Module({
    imports: [PrismaModule, SofApiModule],
    controllers: [DotacaoController],
    providers: [DotacaoService]
})
export class DotacaoModule { }

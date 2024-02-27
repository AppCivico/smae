import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EleicaoController } from './eleicao.controller';
import { EleicaoService } from './eleicao.service';

@Module({
    imports: [PrismaModule],
    controllers: [EleicaoController],
    providers: [EleicaoService],
    exports: [EleicaoService],
})
export class EleicaoModule {}

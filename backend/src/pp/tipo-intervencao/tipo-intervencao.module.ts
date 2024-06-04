import { Module } from '@nestjs/common';
import { TipoIntervencaoController } from './tipo-intervencao.controller';
import { TipoIntervencaoService } from './tipo-intervencao.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [TipoIntervencaoController],
    providers: [TipoIntervencaoService],
})
export class TipoIntervencaoModule {}

import { Module } from '@nestjs/common';
import { EtapaService } from 'src/etapa/etapa.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { CronogramaController } from './cronograma.controller';
import { CronogramaService } from './cronograma.service';

@Module({
    imports: [PrismaModule],
    controllers: [CronogramaController],
    providers: [CronogramaService, EtapaService],
    exports: [CronogramaService, EtapaService]
})
export class CronogramaModule { }

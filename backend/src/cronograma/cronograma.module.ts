import { Module } from '@nestjs/common';
import { EtapaService } from '../etapa/etapa.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CronogramaController } from './cronograma.controller';
import { CronogramaService } from './cronograma.service';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';

@Module({
    imports: [PrismaModule, CronogramaEtapaModule],
    controllers: [CronogramaController],
    providers: [CronogramaService, EtapaService, CronogramaEtapaService],
    exports: [CronogramaService, EtapaService],
})
export class CronogramaModule {}

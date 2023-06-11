import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EtapaController } from './etapa.controller';
import { EtapaService } from './etapa.service';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';

@Module({
    imports: [PrismaModule, CronogramaEtapaModule],
    controllers: [EtapaController],
    providers: [EtapaService, CronogramaEtapaService],
    exports: [EtapaService],
})
export class EtapaModule {}

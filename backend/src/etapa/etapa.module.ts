import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { EtapaController } from './etapa.controller';
import { EtapaService } from './etapa.service';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { GeoLocModule } from '../geo-loc/geo-loc.module';

@Module({
    imports: [PrismaModule, CronogramaEtapaModule, GeoLocModule],
    controllers: [EtapaController],
    providers: [EtapaService, CronogramaEtapaService],
    exports: [EtapaService],
})
export class EtapaModule {}

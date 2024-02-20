import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CronogramaEtapaController } from './cronograma-etapas.controller';
import { CronogramaEtapaService } from './cronograma-etapas.service';
import { GeoLocModule } from '../geo-loc/geo-loc.module';

@Module({
    imports: [PrismaModule, GeoLocModule],
    controllers: [CronogramaEtapaController],
    providers: [CronogramaEtapaService],
    exports: [CronogramaEtapaService],
})
export class CronogramaEtapaModule {}

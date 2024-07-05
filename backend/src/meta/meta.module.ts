import { Module } from '@nestjs/common';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { UploadModule } from 'src/upload/upload.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MetaController, MetaSetorialController } from './meta.controller';
import { MetaService } from './meta.service';
import { GeoLocModule } from '../geo-loc/geo-loc.module';

@Module({
    imports: [PrismaModule, CronogramaEtapaModule, UploadModule, GeoLocModule],
    controllers: [MetaController, MetaSetorialController],
    providers: [MetaService, CronogramaEtapaService],
    exports: [MetaService],
})
export class MetaModule {}

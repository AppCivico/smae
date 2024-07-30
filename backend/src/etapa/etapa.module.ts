import { Module } from '@nestjs/common';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { GeoLocModule } from '../geo-loc/geo-loc.module';
import { MetaModule } from '../meta/meta.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { EtapaController, EtapaPSController } from './etapa.controller';
import { EtapaService } from './etapa.service';

@Module({
    imports: [PrismaModule, CronogramaEtapaModule, GeoLocModule, VariavelModule, MetaModule],
    controllers: [EtapaController, EtapaPSController],
    providers: [EtapaService],
    exports: [EtapaService],
})
export class EtapaModule {}

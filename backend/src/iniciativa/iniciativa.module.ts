import { Module } from '@nestjs/common';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { GeoLocModule } from '../geo-loc/geo-loc.module';
import { MetaModule } from '../meta/meta.module';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { IniciativaController, IniciativaSetorialController } from './iniciativa.controller';
import { IniciativaService } from './iniciativa.service';

@Module({
    imports: [PrismaModule, MetaModule, VariavelModule, CronogramaEtapaModule, GeoLocModule],
    controllers: [IniciativaController, IniciativaSetorialController],
    providers: [IniciativaService, CronogramaEtapaService],
})
export class IniciativaModule {}

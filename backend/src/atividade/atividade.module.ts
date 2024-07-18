import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { VariavelModule } from '../variavel/variavel.module';
import { AtividadeController } from './atividade.controller';
import { AtividadeService } from './atividade.service';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { GeoLocModule } from '../geo-loc/geo-loc.module';
import { MetaModule } from '../meta/meta.module';

@Module({
    imports: [PrismaModule, MetaModule, VariavelModule, CronogramaEtapaModule, GeoLocModule],
    controllers: [AtividadeController],
    providers: [AtividadeService, CronogramaEtapaService],
})
export class AtividadeModule {}

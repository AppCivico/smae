import { Module } from '@nestjs/common';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { EtapaModule } from '../etapa/etapa.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CronogramaController } from './cronograma.controller';
import { CronogramaService } from './cronograma.service';
import { MetaModule } from '../meta/meta.module';

@Module({
    imports: [PrismaModule, CronogramaEtapaModule, EtapaModule, MetaModule],
    controllers: [CronogramaController],
    providers: [CronogramaService],
    exports: [CronogramaService],
})
export class CronogramaModule {}

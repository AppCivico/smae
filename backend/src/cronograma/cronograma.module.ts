import { Module } from '@nestjs/common';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { EtapaModule } from '../etapa/etapa.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CronogramaController } from './cronograma.controller';
import { CronogramaService } from './cronograma.service';

@Module({
    imports: [PrismaModule, CronogramaEtapaModule, EtapaModule],
    controllers: [CronogramaController],
    providers: [CronogramaService],
    exports: [CronogramaService],
})
export class CronogramaModule {}

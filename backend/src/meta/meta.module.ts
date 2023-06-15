import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';

@Module({
    imports: [PrismaModule, CronogramaEtapaModule, UploadModule],
    controllers: [MetaController],
    providers: [MetaService, CronogramaEtapaService],
    exports: [MetaService]
})
export class MetaModule {}

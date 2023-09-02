import { Module } from '@nestjs/common';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { CronogramaEtapaService } from 'src/cronograma-etapas/cronograma-etapas.service';
import { UploadModule } from 'src/upload/upload.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';

@Module({
    imports: [PrismaModule, CronogramaEtapaModule, UploadModule],
    controllers: [MetaController],
    providers: [MetaService, CronogramaEtapaService],
    exports: [MetaService],
})
export class MetaModule {}

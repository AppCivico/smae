import { Module, forwardRef } from '@nestjs/common';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { UploadModule } from 'src/upload/upload.module';
import { GeoLocModule } from '../geo-loc/geo-loc.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MetaController, MetaSetorialController } from './meta.controller';
import { MetaService } from './meta.service';
import { PdmModule } from '../pdm/pdm.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => PdmModule),
        forwardRef(() => CronogramaEtapaModule),
        UploadModule,
        GeoLocModule,
    ],
    controllers: [MetaController, MetaSetorialController],
    providers: [MetaService],
    exports: [MetaService],
})
export class MetaModule {}

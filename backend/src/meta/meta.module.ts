import { Module, forwardRef } from '@nestjs/common';
import { CronogramaEtapaModule } from 'src/cronograma-etapas/cronograma-etapas.module';
import { UploadModule } from 'src/upload/upload.module';
import { PrismaModule } from '../prisma/prisma.module';
import { MetaController } from './meta.controller';
import { MetaService } from './meta.service';
import { GeoLocModule } from '../geo-loc/geo-loc.module';
import { IniciativaModule } from 'src/iniciativa/iniciativa.module';
import { AtividadeModule } from 'src/atividade/atividade.module';
import { AtividadeService } from 'src/atividade/atividade.service';

@Module({
    imports: [
        PrismaModule,
        CronogramaEtapaModule,
        UploadModule,
        GeoLocModule,
        forwardRef(() => AtividadeModule),
        IniciativaModule,
        CronogramaEtapaModule,
    ],
    controllers: [MetaController],
    providers: [MetaService, AtividadeService],
    exports: [MetaService],
})
export class MetaModule {}

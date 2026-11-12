import { Module } from '@nestjs/common';
import { CronogramaEtapaModule } from '../../cronograma-etapas/cronograma-etapas.module';
import { CronogramaModule } from '../../cronograma/cronograma.module';
import { EtapaModule } from '../../etapa/etapa.module';
import { MetaModule } from '../../meta/meta.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { VariavelModule } from '../../variavel/variavel.module';
import { MetasCronogramaService } from './../metas/metas-cronograma.service';
import { MetasCronogramaController } from './../metas/metas-cronogramas.controller';
import { MetasController } from './../metas/metas.controller';
import { MetasService } from './../metas/metas.service';
import { MfModule } from './../mf.module';
import { MfDashMetasController } from './dash/metas.controller';
import { MfDashMetasService } from './dash/metas.service';

@Module({
    imports: [
        PrismaModule,
        MfModule,
        VariavelModule,
        UploadModule,
        CronogramaModule,
        CronogramaEtapaModule,
        EtapaModule,
        MetaModule,
    ],
    controllers: [MetasController, MetasCronogramaController, MfDashMetasController],
    providers: [MetasService, MetasCronogramaService, MfDashMetasService],
    exports: [MetasService],
})
export class MonitMetasModule {}

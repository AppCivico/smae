import { forwardRef, Module } from '@nestjs/common';
import { MetaModule } from '../meta/meta.module';
import { MonitMetasModule } from '../mf/metas/metas.module';
import { PdmModule } from '../pdm/pdm.module';
import { PrismaModule } from '../prisma/prisma.module';
import { UploadModule } from '../upload/upload.module';
import { PdmCicloController, PsCicloController } from './pdm-ciclo.controller';
import { PdmCicloService } from './pdm-ciclo.service';
import { PsCicloFaseController } from './ps-ciclo-fase.controller';
import { PsCicloFaseService } from './ps-ciclo-fase.service';
import { PsCicloService } from './ps-ciclo.service';
import { PsMonitoramentoMigracaoService } from './ps-monitoramento-migracao.service';

@Module({
    imports: [PrismaModule, MonitMetasModule, MetaModule, forwardRef(() => PdmModule), UploadModule],
    controllers: [PdmCicloController, PsCicloController, PsCicloFaseController],
    providers: [PdmCicloService, PsCicloService, PsCicloFaseService, PsMonitoramentoMigracaoService],
})
export class PdmCicloModule {}

import { Module } from '@nestjs/common';
import { MetaModule } from '../meta/meta.module';
import { MonitMetasModule } from '../mf/metas/metas.module';
import { PrismaModule } from '../prisma/prisma.module';
import { PdmCicloController, PsCicloController } from './pdm-ciclo.controller';
import { PdmCicloService } from './pdm-ciclo.service';
import { PsCicloService } from './ps-ciclo.service';

@Module({
    imports: [PrismaModule, MonitMetasModule, MetaModule],
    controllers: [PdmCicloController, PsCicloController],
    providers: [PdmCicloService, PsCicloService],
})
export class PdmCicloModule {}

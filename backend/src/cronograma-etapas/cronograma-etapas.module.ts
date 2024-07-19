import { Module, forwardRef } from '@nestjs/common';
import { GeoLocModule } from '../geo-loc/geo-loc.module';
import { MetaModule } from '../meta/meta.module';
import { PrismaModule } from '../prisma/prisma.module';
import { CronogramaEtapaController } from './cronograma-etapas.controller';
import { CronogramaEtapaService } from './cronograma-etapas.service';

@Module({
    imports: [PrismaModule, GeoLocModule, forwardRef(() => MetaModule)],
    controllers: [CronogramaEtapaController],
    providers: [CronogramaEtapaService],
    exports: [CronogramaEtapaService],
})
export class CronogramaEtapaModule {}

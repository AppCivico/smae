import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { CacheKVModule } from '../../common/services/cache-kv.module';
import { GeoLocModule } from '../../geo-loc/geo-loc.module';
import { TaskModule } from '../../task/task.module';
import { DemandaController } from './demanda.controller';
import { DemandaService } from './demanda.service';
import { PublicDemandaController } from './public-demanda.controller';
import { OrgaoModule } from '../../orgao/orgao.module';

@Module({
    imports: [
        PrismaModule,
        UploadModule,
        forwardRef(() => GeoLocModule),
        CacheKVModule,
        forwardRef(() => TaskModule),
        forwardRef(() => OrgaoModule),
    ],
    controllers: [DemandaController, PublicDemandaController],
    providers: [DemandaService],
    exports: [DemandaService],
})
export class DemandaModule {}

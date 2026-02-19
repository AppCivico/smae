import { forwardRef, Module } from '@nestjs/common';
import { CacheKVModule } from '../../common/services/cache-kv.module';
import { GeoLocModule } from '../../geo-loc/geo-loc.module';
import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { RefreshDemandaService } from './refresh-demanda.service';

@Module({
    imports: [
        PrismaModule,
        CacheKVModule,
        forwardRef(() => GeoLocModule),
        forwardRef(() => UploadModule),
    ],
    providers: [RefreshDemandaService],
    exports: [RefreshDemandaService],
})
export class RefreshDemandaModule {}

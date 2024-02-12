import { Module } from '@nestjs/common';
import { GeoApiService } from './geo-api.service';

@Module({
    providers: [GeoApiService],
    exports: [GeoApiService],
})
export class GeoApiModule {}

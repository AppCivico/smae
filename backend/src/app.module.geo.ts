import { Module, forwardRef } from '@nestjs/common';
import { GeoApiModule } from './geo-api/geo-api.module';
import { GeoBuscaModule } from './geo-busca/geo-busca.module';
import { GeoLocModule } from './geo-loc/geo-loc.module';

/**
 * Geographic modules aggregation
 * Consolidates all geographic and location-related modules:
 * - GeoApi: External geographic API integration
 * - GeoLoc: Location/geolocation services
 * - GeoBusca: Geographic search functionality
 */
@Module({
    imports: [
        GeoApiModule,
        forwardRef(() => GeoLocModule),
        GeoBuscaModule,
    ],
    exports: [GeoLocModule],
})
export class AppModuleGeo {}

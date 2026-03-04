import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { VinculoModule } from '../casa-civil/vinculo/vinculo.module';
import { GeoApiModule } from '../geo-api/geo-api.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GeoLocController } from './geo-loc.controller';
import { GeoLocService } from './geo-loc.service';

@Module({
    imports: [
        PrismaModule,
        GeoApiModule,
        forwardRef(() => VinculoModule),
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':geo',
            signOptions: { expiresIn: '1d' },
        }),
    ],
    controllers: [GeoLocController],
    providers: [GeoLocService],
    exports: [GeoLocService],
})
export class GeoLocModule {}

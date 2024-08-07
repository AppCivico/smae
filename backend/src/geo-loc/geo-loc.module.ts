import { Module } from '@nestjs/common';
import { GeoApiModule } from '../geo-api/geo-api.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GeoLocController } from './geo-loc.controller';
import { GeoLocService } from './geo-loc.service';
import { JwtModule } from '@nestjs/jwt';
import { SmaeConfigModule } from '../common/services/smae-config.module';

@Module({
    imports: [
        PrismaModule,
        GeoApiModule,
        SmaeConfigModule,
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

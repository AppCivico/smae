import { Module, forwardRef } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { CacheKVModule } from '../../common/services/cache-kv.module';
import { GeoLocModule } from '../../geo-loc/geo-loc.module';
import { TaskModule } from '../../task/task.module';
import { DemandaAcaoController, DemandaController } from './demanda.controller';
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
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [DemandaController, PublicDemandaController, DemandaAcaoController],
    providers: [DemandaService],
    exports: [DemandaService],
})
export class DemandaModule {}

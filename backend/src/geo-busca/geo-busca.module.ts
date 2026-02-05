import { Module, forwardRef } from '@nestjs/common';
import { GeoLocModule } from '../geo-loc/geo-loc.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GeoBuscaController } from './geo-busca.controller';
import { GeoBuscaService } from './geo-busca.service';

@Module({
    imports: [PrismaModule, forwardRef(() => GeoLocModule)],
    controllers: [GeoBuscaController],
    providers: [GeoBuscaService],
    exports: [GeoBuscaService],
})
export class GeoBuscaModule {}

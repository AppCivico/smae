import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UploadModule } from 'src/upload/upload.module';
import { GeoLocModule } from '../../geo-loc/geo-loc.module';
import { DemandaAcaoModule } from './acao/acao.module';
import { DemandaController } from './demanda.controller';
import { DemandaService } from './demanda.service';

@Module({
    imports: [PrismaModule, UploadModule, forwardRef(() => GeoLocModule), DemandaAcaoModule],
    controllers: [DemandaController],
    providers: [DemandaService],
    exports: [DemandaService],
})
export class DemandaModule {}

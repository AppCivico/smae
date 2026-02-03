import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { UploadModule } from '../../../upload/upload.module';
import { GeoLocModule } from '../../../geo-loc/geo-loc.module';
import { DemandaService } from '../demanda.service';
import { DemandaAcaoController } from './acao.controller';
import { DemandaAcaoService } from './acao.service';

@Module({
    imports: [PrismaModule, UploadModule, GeoLocModule],
    controllers: [DemandaAcaoController],
    providers: [DemandaAcaoService, DemandaService],
    exports: [DemandaAcaoService],
})
export class DemandaAcaoModule {}

import { Module } from '@nestjs/common';
import { IndicadoresService } from './indicadores.service';
import { IndicadoresController } from './indicadores.controller';
import { UtilsService } from '../utils/utils.service';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [IndicadoresController],
    providers: [IndicadoresService, UtilsService],
    exports: [IndicadoresService],
})
export class IndicadoresModule {}

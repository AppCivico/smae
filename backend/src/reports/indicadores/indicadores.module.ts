import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { IndicadoresController } from './indicadores.controller';
import { IndicadoresService } from './indicadores.service';

@Module({
    imports: [PrismaModule],
    controllers: [IndicadoresController],
    providers: [IndicadoresService, UtilsService],
    exports: [IndicadoresService],
})
export class IndicadoresModule {}

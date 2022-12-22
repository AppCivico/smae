import { Module } from '@nestjs/common';
import { IndicadoresService } from './indicadores.service';
import { IndicadoresController } from './indicadores.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';

@Module({
    imports: [PrismaModule],
    controllers: [IndicadoresController],
    providers: [IndicadoresService, UtilsService],
    exports: [IndicadoresService],
})
export class IndicadoresModule { }

import { Module } from '@nestjs/common';
import { IndicadoresService } from './indicadores.service';
import { IndicadoresController } from './indicadores.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
    imports: [PrismaModule],
    controllers: [IndicadoresController],
    providers: [IndicadoresService],
    exports: [IndicadoresService],
})
export class IndicadoresModule { }

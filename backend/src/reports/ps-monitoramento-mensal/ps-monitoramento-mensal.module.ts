import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { PsMonitoramentoMensalController } from './ps-monitoramento-mensal.controller';
import { MonitoramentoMensalPs } from './ps-monitoramento-mensal.service';
import { IndicadoresService } from '../indicadores/indicadores.service';

@Module({
    imports: [PrismaModule],
    controllers: [PsMonitoramentoMensalController],
    providers: [MonitoramentoMensalPs, UtilsService,IndicadoresService],
    exports: [MonitoramentoMensalPs],
})
export class PsMonitoramentoMensalModule {}

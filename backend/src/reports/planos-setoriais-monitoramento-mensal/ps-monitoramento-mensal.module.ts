import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { PsMonitoramentoMensalController } from './ps-monitoramento-mensal.controller';
import { MonitoramentoMensalVariaveisPs } from './ps-monitoramento-mensal.service';
import { IndicadoresService } from '../indicadores/indicadores.service';

@Module({
    imports: [PrismaModule],
    controllers: [PsMonitoramentoMensalController],
    providers: [MonitoramentoMensalVariaveisPs, UtilsService,IndicadoresService],
    exports: [MonitoramentoMensalVariaveisPs],
})
export class PsMonitoramentoMensalModule {}

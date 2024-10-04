import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { PsMonitoramentoMensalController } from './ps-monitoramento-mensal.controller';
import { PSMonitoramentoMensal } from './ps-monitoramento-mensal.service';
import { IndicadoresService } from '../indicadores/indicadores.service';

@Module({
    imports: [PrismaModule],
    controllers: [PsMonitoramentoMensalController],
    providers: [PSMonitoramentoMensal, UtilsService,IndicadoresService],
    exports: [PSMonitoramentoMensal],
})
export class PsMonitoramentoMensalModule {}

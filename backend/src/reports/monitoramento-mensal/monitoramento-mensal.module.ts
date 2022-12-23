import { Module } from '@nestjs/common';
import { MonitoramentoMensalService } from './monitoramento-mensal.service';
import { MonitoramentoMensalController } from './monitoramento-mensal.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { PainelModule } from 'src/painel/painel.module';
import { MonitoramentoMensalMfService } from './monitoramento-mensal-mf.service';

@Module({
    imports: [PrismaModule, PainelModule],
    controllers: [MonitoramentoMensalController],
    providers: [
        MonitoramentoMensalService,
        MonitoramentoMensalMfService,
        UtilsService,
    ],
    exports: [MonitoramentoMensalService],
})
export class MonitoramentoMensalModule { }

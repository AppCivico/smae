import { Module } from '@nestjs/common';
import { MetasModule } from '../../../src/mf/metas/metas.module';
import { PainelModule } from '../../../src/painel/painel.module';
import { PrismaModule } from '../../../src/prisma/prisma.module';
import { UtilsService } from '../utils/utils.service';
import { MonitoramentoMensalMfService } from './monitoramento-mensal-mf.service';
import { MonitoramentoMensalController } from './monitoramento-mensal.controller';
import { MonitoramentoMensalService } from './monitoramento-mensal.service';

@Module({
    imports: [PrismaModule, PainelModule, MetasModule],
    controllers: [MonitoramentoMensalController],
    providers: [MonitoramentoMensalService, MonitoramentoMensalMfService, UtilsService],
    exports: [MonitoramentoMensalService],
})
export class MonitoramentoMensalModule {}

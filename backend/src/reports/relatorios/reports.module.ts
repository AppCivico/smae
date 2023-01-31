import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { IndicadoresModule } from '../indicadores/indicadores.module';
import { MonitoramentoMensalModule } from '../monitoramento-mensal/monitoramento-mensal.module';
import { OrcamentoModule } from '../orcamento/orcamento.module';
import { PPProjetoModule } from '../pp-projeto/pp-projeto.module';
import { PrevisaoCustoModule } from '../previsao-custo/previsao-custo.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
    imports: [
        PrismaModule,
        OrcamentoModule,
        UploadModule,
        IndicadoresModule,
        MonitoramentoMensalModule,
        PrevisaoCustoModule,
        PPProjetoModule,
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        }),
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
})
export class ReportsModule {}

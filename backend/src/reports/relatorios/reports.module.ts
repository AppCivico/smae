import { forwardRef, Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../../prisma/prisma.module';
import { UploadModule } from '../../upload/upload.module';
import { IndicadoresModule } from '../indicadores/indicadores.module';
import { MonitoramentoMensalModule } from '../monitoramento-mensal/monitoramento-mensal.module';
import { OrcamentoModule } from '../orcamento/orcamento.module';
import { PPProjetoModule } from '../pp-projeto/pp-projeto.module';
import { PPProjetosModule } from '../pp-projetos/pp-projetos.module';
import { PrevisaoCustoModule } from '../previsao-custo/previsao-custo.module';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { PPStatusModule } from '../pp-status/pp-status.module';
import { ParlamentaresModule } from '../parlamentares/parlamentares.module';
import { TransferenciasModule } from '../transferencias/transferencias.module';
import { PPObrasModule } from '../pp-obras/pp-obras.module';
import { TribunalDeContasModule } from '../tribunal-de-contas/tribunal-de-contas.module';
import { PsMonitoramentoMensalModule } from '../ps-monitoramento-mensal/ps-monitoramento-mensal.module';
import {
    CasaCivilAtividadesPendentesModule
} from '../casa-civil-atividades-pendentes/casa-civil-atividades-pendentes.module';
import { PessoaModule } from '../../pessoa/pessoa.module';
import { TaskModule } from '../../task/task.module';

@Module({
    imports: [
        PrismaModule,
        forwardRef(() => PessoaModule),
        forwardRef(() => OrcamentoModule),
        forwardRef(() => UploadModule),
        forwardRef(() => IndicadoresModule),
        forwardRef(() => MonitoramentoMensalModule),
        forwardRef(() => PrevisaoCustoModule),
        forwardRef(() => PPProjetoModule),
        forwardRef(() => PPProjetosModule),
        forwardRef(() => PPStatusModule),
        forwardRef(() => PPObrasModule),
        forwardRef(() => ParlamentaresModule),
        forwardRef(() => TransferenciasModule),
        forwardRef(() => TribunalDeContasModule),
        forwardRef(() => PsMonitoramentoMensalModule),
        forwardRef(() => CasaCivilAtividadesPendentesModule),
        forwardRef(() => TaskModule),
        JwtModule.register({
            secret: process.env.SESSION_JWT_SECRET + ':pagination',
            signOptions: { expiresIn: '30d' },
        })
    ],
    controllers: [ReportsController],
    providers: [ReportsService],
    exports: [ReportsService],
})
export class ReportsModule {}

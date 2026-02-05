import { Module } from '@nestjs/common';
import { CasaCivilAtividadesPendentesModule } from './reports/casa-civil-atividades-pendentes/casa-civil-atividades-pendentes.module';
import { IndicadoresModule } from './reports/indicadores/indicadores.module';
import { MonitoramentoMensalModule } from './reports/monitoramento-mensal/monitoramento-mensal.module';
import { OrcamentoModule } from './reports/orcamento/orcamento.module';
import { ParlamentaresModule } from './reports/parlamentares/parlamentares.module';
import { PPObrasModule } from './reports/pp-obras/pp-obras.module';
import { PPProjetoModule } from './reports/pp-projeto/pp-projeto.module';
import { PPProjetosModule } from './reports/pp-projetos/pp-projetos.module';
import { PPStatusModule } from './reports/pp-status/pp-status.module';
import { PrevisaoCustoModule } from './reports/previsao-custo/previsao-custo.module';
import { ProjetoOrcamentoModule } from './reports/projeto-orcamento/projeto-orcamento.module';
import { ReportProjetoPrevisaoCustoModule } from './reports/projeto-previsao-custo/projeto-previsao-custo.module';
import { PsMonitoramentoMensalModule } from './reports/ps-monitoramento-mensal/ps-monitoramento-mensal.module';
import { ReportsModule } from './reports/relatorios/reports.module';
import { TransferenciasModule } from './reports/transferencias/transferencias.module';
import { TribunalDeContasModule } from './reports/tribunal-de-contas/tribunal-de-contas.module';

/**
 * Reports modules aggregation
 * Consolidates all report and analytics modules:
 * - Relatorios (general reports)
 * - PP reports (project portfolio reports)
 * - Orcamento reports (budget reports)
 * - Monitoramento reports (monitoring reports)
 * - Transferencias and Tribunal de Contas
 */
@Module({
    imports: [
        ReportsModule,
        IndicadoresModule,
        MonitoramentoMensalModule,
        OrcamentoModule,
        PrevisaoCustoModule,
        PPProjetoModule,
        PPProjetosModule,
        PPStatusModule,
        PPObrasModule,
        ParlamentaresModule,
        TransferenciasModule,
        TribunalDeContasModule,
        PsMonitoramentoMensalModule,
        CasaCivilAtividadesPendentesModule,
        ProjetoOrcamentoModule,
        ReportProjetoPrevisaoCustoModule,
    ],
})
export class AppModuleReports {}

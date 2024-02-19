import { Module } from '@nestjs/common';
import { GraphvizModule } from './graphviz/graphviz.module';
import { ImportacaoOrcamentoModule } from './importacao-orcamento/importacao-orcamento.module';
import { AcompanhamentoTipoModule } from './pp/acompanhamento-tipo/acompanhamento-tipo.module';
import { AcompanhamentoModule } from './pp/acompanhamento/acompanhamento.module';
import { GrupoPortfolioModule } from './pp/grupo-portfolio/grupo-portfolio.module';
import { LicoesAprendidasModule } from './pp/licoes-aprendidas/licoes-aprendidas.module';
import { OrcamentoPlanejadoModule as PPOrcamentoPlanejadoModule } from './pp/orcamento-planejado/orcamento-planejado.module';
import { PlanoAcaoMonitoramentoModule } from './pp/plano-acao-monitoramento/plano-acao-monitoramento.module';
import { PlanoAcaoModule } from './pp/plano-de-acao/plano-de-acao.module';
import { PortfolioModule } from './pp/portfolio/portfolio.module';
import { ProjetoModule } from './pp/projeto/projeto.module';
import { RiscoModule } from './pp/risco/risco.module';
import { TarefaModule } from './pp/tarefa/tarefa.module';
import { PPProjetoModule } from './reports/pp-projeto/pp-projeto.module';
import { ProjetoOrcamentoModule } from './reports/projeto-orcamento/projeto-orcamento.module';
import { ProjetoPrevisaoCustoModule } from './reports/projeto-previsao-custo/projeto-previsao-custo.module';
import { OrcamentoRealizadoModule as PPOrcamentoRealizadoModule } from './pp/orcamento-realizado/orcamento-realizado.module';
import { AcaoModule } from './pp/projeto/acao/acao.module';

@Module({
    imports: [
        ProjetoModule,
        PortfolioModule,
        PPProjetoModule,
        TarefaModule,
        RiscoModule,
        PlanoAcaoModule,
        PlanoAcaoMonitoramentoModule,
        AcompanhamentoModule,
        LicoesAprendidasModule,
        PPOrcamentoRealizadoModule,
        GraphvizModule,
        PPOrcamentoPlanejadoModule,
        ProjetoPrevisaoCustoModule,
        ProjetoOrcamentoModule,
        ImportacaoOrcamentoModule, // carregar depois do OrcamentoPrevistoModule
        AcompanhamentoTipoModule,
        GrupoPortfolioModule,
        AcaoModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModuleProjeto {}

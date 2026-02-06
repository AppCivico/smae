import { Module } from '@nestjs/common';
import { PainelEstrategicoModule } from './gestao-projetos/painel-estrategico/painel-estrategico.module';
import { GraphvizModule } from './graphviz/graphviz.module';
import { ImportacaoOrcamentoModule } from './importacao-orcamento/importacao-orcamento.module';
import { ProjetoModalidadeContratacaoModule } from './pp/_mdo/modalidade-contratacao/mod-contratacao.module';
import { ProjetoProgramaModule } from './pp/_mdo/projeto-programa/programa.module';
import { AcompanhamentoTipoModule } from './pp/acompanhamento-tipo/acompanhamento-tipo.module';
import { AcompanhamentoModule } from './pp/acompanhamento/acompanhamento.module';
import { ContratoAditivoModule } from './pp/contrato-aditivo/contrato-aditivo.module';
import { ContratoModule } from './pp/contrato/contrato.module';
import { EmpreendimentoModule } from './pp/empreendimento/empreendimento.module';
import { EquipamentoModule } from './pp/equipamento/equipamento.module';
import { GrupoPortfolioModule } from './pp/grupo-portfolio/grupo-portfolio.module';
import { GrupoTematicoModule } from './pp/grupo-tematico/grupo-tematico.module';
import { LicoesAprendidasModule } from './pp/licoes-aprendidas/licoes-aprendidas.module';
import { OrcamentoPlanejadoModule as PPOrcamentoPlanejadoModule } from './pp/orcamento-planejado/orcamento-planejado.module';
import { OrcamentoPrevistoModule } from './pp/orcamento-previsto/orcamento-previsto.module';
import { OrcamentoRealizadoModule as PPOrcamentoRealizadoModule } from './pp/orcamento-realizado/orcamento-realizado.module';
import { PlanoAcaoMonitoramentoModule } from './pp/plano-acao-monitoramento/plano-acao-monitoramento.module';
import { PlanoAcaoModule } from './pp/plano-de-acao/plano-de-acao.module';
import { PortfolioModule } from './pp/portfolio/portfolio.module';
import { ProjetoTagModule } from './pp/projeto-tag/tag.module';
import { AcaoModule } from './pp/projeto/acao/acao.module';
import { ProjetoModule } from './pp/projeto/projeto.module';
import { RiscoModule } from './pp/risco/risco.module';
import { TarefaModule } from './pp/tarefa/tarefa.module';
import { TipoIntervencaoModule } from './pp/tipo-intervencao/tipo-intervencao.module';
import { ProjetoEtapaModule } from './projeto-etapa/projeto-etapa.module';
import { PPProjetoModule } from './reports/pp-projeto/pp-projeto.module';
import { ProjetoOrcamentoModule } from './reports/projeto-orcamento/projeto-orcamento.module';
import { ReportProjetoPrevisaoCustoModule } from './reports/projeto-previsao-custo/projeto-previsao-custo.module';
import { ProjetoTipoAditivoModule } from './tipo-aditivo/tipo-aditivo.module';

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
        OrcamentoPrevistoModule,
        PPOrcamentoRealizadoModule,
        GraphvizModule,
        PPOrcamentoPlanejadoModule,
        ReportProjetoPrevisaoCustoModule,
        ProjetoOrcamentoModule,
        ImportacaoOrcamentoModule,
        AcompanhamentoTipoModule,
        GrupoPortfolioModule,
        AcaoModule,
        ProjetoEtapaModule,
        EquipamentoModule,
        GrupoTematicoModule,
        TipoIntervencaoModule,
        ProjetoTagModule,
        ProjetoTipoAditivoModule,
        ProjetoProgramaModule,
        ProjetoModalidadeContratacaoModule,
        ContratoModule,
        ContratoAditivoModule,
        EmpreendimentoModule,
        PainelEstrategicoModule,
    ],
    controllers: [],
    providers: [],
})
export class AppModuleProjeto {}

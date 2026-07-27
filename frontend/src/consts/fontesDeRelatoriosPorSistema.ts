import { ModuloSistema } from '@/consts/modulosDoSistema';

import type { CreateRelatorioModeloDto } from '@back/reports/relatorio-modelo/dto/create-relatorio-modelo.dto';

type Fonte = CreateRelatorioModeloDto['fonte'];

export type FontePorSistema = {
  nome: string;
  valor: Fonte;
};

/**
 * Mantido em espelho manual com `FONTES_POR_SISTEMA` de
 * `backend/src/reports/helpers/report-priv.helper.ts` — fonte única da verdade de a que sistema
 * cada fonte de relatório pertence. Fontes `PS*` aparecem tanto em `PlanoSetorial` quanto em
 * `ProgramaDeMetas` porque valem para os dois. Os `nome` seguem os mesmos rótulos já usados nas
 * rotas de geração de relatório (`router/relatorios.js`), quando existentes — é a mesma fonte de
 * verdade para o `títuloParaMenu` daquelas rotas.
 *
 * Cada fonte também é a chave da sua própria entrada (como em `consts/projectStatuses.js`), pra
 * permitir lookup direto (`FONTES_POR_SISTEMA.Projetos.Projetos`) em vez de `Array.find`.
 */
type FontesDoSistema = Readonly<Partial<Record<Fonte, FontePorSistema>>>;

const FONTES_POR_SISTEMA: Record<ModuloSistema, FontesDoSistema> = {
  [ModuloSistema.SMAE]: {},
  [ModuloSistema.PDM]: {
    Orcamento: { nome: 'Relatórios orçamentários', valor: 'Orcamento' },
    PrevisaoCusto: { nome: 'Previsão de custo', valor: 'PrevisaoCusto' },
    Indicadores: { nome: 'Relatório Semestral/Anual', valor: 'Indicadores' },
    MonitoramentoMensal: { nome: 'Relatório Mensal', valor: 'MonitoramentoMensal' },
  },
  [ModuloSistema.PlanoSetorial]: {
    PSOrcamento: { nome: 'Orçamentário', valor: 'PSOrcamento' },
    PSPrevisaoCusto: { nome: 'Previsão de Custo', valor: 'PSPrevisaoCusto' },
    PSIndicadores: { nome: 'Semestral ou Anual', valor: 'PSIndicadores' },
    PSMonitoramentoMensal: { nome: 'Mensal', valor: 'PSMonitoramentoMensal' },
  },
  [ModuloSistema.ProgramaDeMetas]: {
    PSOrcamento: { nome: 'Orçamentário', valor: 'PSOrcamento' },
    PSPrevisaoCusto: { nome: 'Previsão de Custo', valor: 'PSPrevisaoCusto' },
    PSIndicadores: { nome: 'Semestral ou Anual', valor: 'PSIndicadores' },
    PSMonitoramentoMensal: { nome: 'Mensal', valor: 'PSMonitoramentoMensal' },
  },
  [ModuloSistema.Projetos]: {
    Projeto: { nome: 'Projeto', valor: 'Projeto' },
    Projetos: { nome: 'Portfólio', valor: 'Projetos' },
    ProjetoStatus: { nome: 'Status', valor: 'ProjetoStatus' },
    ProjetoOrcamento: { nome: 'Orçamentário de Portfólio', valor: 'ProjetoOrcamento' },
    ProjetoPrevisaoCusto: { nome: 'Previsão de Custo de Portfólio', valor: 'ProjetoPrevisaoCusto' },
  },
  [ModuloSistema.MDO]: {
    Obras: { nome: 'Relatório de portfólio', valor: 'Obras' },
    ObraStatus: { nome: 'Relatório de status', valor: 'ObraStatus' },
    ObrasOrcamento: { nome: 'Execução orçamentária', valor: 'ObrasOrcamento' },
    ObrasPrevisaoCusto: { nome: 'Previsão de custo', valor: 'ObrasPrevisaoCusto' },
  },
  [ModuloSistema.CasaCivil]: {
    Parlamentares: { nome: 'Parlamentares', valor: 'Parlamentares' },
    TribunalDeContas: { nome: 'Tribunal de contas', valor: 'TribunalDeContas' },
    Transferencias: { nome: 'Transferências voluntárias', valor: 'Transferencias' },
    AtvPendentes: { nome: 'Atividades pendentes', valor: 'AtvPendentes' },
    Demandas: { nome: 'Demandas', valor: 'Demandas' },
  },
};

export default FONTES_POR_SISTEMA;

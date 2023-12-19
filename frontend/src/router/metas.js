import { default as SubmenuMetas } from '@/components/SubmenuMetas.vue';

import {
  AddEditAtividade,
  AddEditCronograma,
  AddEditIndicador,
  AddEditIniciativa,
  AddEditMetas,
  ListMetas,
  ListMetasGroup,
  SingleAtividade,
  SingleCronograma,
  SingleEvolucao,
  SingleIniciativa,
  SingleMeta, SinglePainelMeta,
} from '@/views/metas';
import {
  AddEditCusteio,
  AddEditPlanejado,
  AddRealizado,
  AddRealizadoNota,
  AddRealizadoProcesso,
  EditRealizado,
  MetaOrcamento,
} from '@/views/orcamento';
import MetaOrçamentoRaiz from '@/views/orcamento/MetaOrçamentoRaiz.vue';

// ░█▀█░▀█▀░█▀▀░█▀█░█▀▀░█▀█░█▀█
// ░█▀█░░█░░█▀▀░█░█░█░░░█▀█░█░█
// ░▀░▀░░▀░░▀▀▀░▀░▀░▀▀▀░▀░▀░▀▀▀
// Devido ao reuso de componentes em rotas aninhadas sem definição de recursão,
// **cuidado** ao usar `rotaDeEscape` e rotas nomeadas! Pode ser necessário
// definí-las inúmeras vezes, para os casos de:
//
// - `/meta/:meta_id`
// - `/meta/:meta_id/iniciativas/:iniciativa_id`
// - `/meta/:meta_id/iniciativas/:iniciativa_id/atividades/:atividade_id`

export default {
  path: '/metas',
  children: [
    { path: '', component: ListMetas },
    { path: 'novo', component: AddEditMetas, props: { type: 'novo', parentPage: 'metas' } },
    { path: 'editar/:meta_id', component: AddEditMetas, props: { type: 'editar', parentPage: 'metas' } },
    { path: 'macrotemas/novo', component: ListMetas, props: { type: 'novo', group: 'macrotemas', parentPage: 'metas' } },
    { path: 'subtemas/novo', component: ListMetas, props: { type: 'novo', group: 'subtemas', parentPage: 'metas' } },
    { path: 'temas/novo', component: ListMetas, props: { type: 'novo', group: 'temas', parentPage: 'metas' } },
    { path: 'tags/novo', component: ListMetas, props: { type: 'novo', group: 'tags', parentPage: 'metas' } },
    { path: 'macrotemas/:id', component: ListMetasGroup, props: { type: 'list', group: 'macro_tema', parentPage: 'metas' } },
    { path: 'macrotemas/:macro_tema_id/novo', component: AddEditMetas, props: { type: 'novo', group: 'macro_tema', parentPage: 'metas' } },
    { path: 'subtemas/:id', component: ListMetasGroup, props: { type: 'list', group: 'sub_tema', parentPage: 'metas' } },
    { path: 'subtemas/:sub_tema_id/novo', component: AddEditMetas, props: { type: 'novo', group: 'sub_tema', parentPage: 'metas' } },
    { path: 'temas/:id', component: ListMetasGroup, props: { type: 'list', group: 'tema', parentPage: 'metas' } },
    { path: 'temas/:tema_id/novo', component: AddEditMetas, props: { type: 'novo', group: 'tema', parentPage: 'metas' } },
    { path: 'tags/:id', component: ListMetasGroup, props: { type: 'list', group: 'tags', parentPage: 'metas' } },
    { path: ':meta_id', component: SingleMeta, props: { submenu: SubmenuMetas } },
    {
      path: ':meta_id/indicadores/novo',
      component: AddEditIndicador,
      meta: { título: 'Adicionar Indicador' },
      props: { submenu: SubmenuMetas },
    },
    {
      path: ':meta_id/indicadores/:indicador_id',
      component: AddEditIndicador,
      name: 'indicadorDaMeta',
      meta: {
        título: 'Editar Indicador',
      },
      props: { submenu: SubmenuMetas },
    },

    { path: ':meta_id/indicadores/:indicador_id/variaveis/novo', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },

    {
      path: ':meta_id/indicadores/:indicador_id/variaveis/gerar',
      component: AddEditIndicador,
      props: { group: 'variaveis', submenu: SubmenuMetas },
      meta: {
        funçãoDaTela: 'gerar',
        rotaDeEscape: 'indicadorDaMeta',
      },
    },

    { path: ':meta_id/indicadores/:indicador_id/variaveis/novo/:copy_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
    { path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
    { path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id/valores', component: AddEditIndicador, props: { group: 'valores', submenu: SubmenuMetas } },
    { path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id/retroativos', component: AddEditIndicador, props: { group: 'retroativos', submenu: SubmenuMetas } },

    // /////////////////////////////////////////////////////////////////////////
    // Variáveis compostas
    // /////////////////////////////////////////////////////////////////////////
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/novo',
      component: AddEditIndicador,
      props: { group: 'criar-ou-editar-variaveis-compostas', submenu: SubmenuMetas },
      meta: { rotaDeEscape: 'indicadorDaMeta', título: 'Nova variável composta' },
    },
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/gerar',
      component: AddEditIndicador,
      props: { group: 'gerar-compostas', submenu: SubmenuMetas },
      meta: { funçãoDaTela: 'gerar', rotaDeEscape: 'indicadorDaMeta', título: 'Auxiliar de variável composta' },
    },
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/:var_id',
      component: AddEditIndicador,
      props: { group: 'criar-ou-editar-variaveis-compostas', submenu: SubmenuMetas },
      meta: { rotaDeEscape: 'indicadorDaMeta', título: 'Editar variável composta' },
    },

    {
      path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/:var_id/valores',
      component: AddEditIndicador,
      props: { group: 'compostas-valores', submenu: SubmenuMetas },
      meta: { rotaDeEscape: 'indicadorDaMeta', título: 'Editar valores previstos', tipoDeValor: 'previsto' },
    },
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/:var_id/retroativos',
      component: AddEditIndicador,
      props: { group: 'compostas-retroativos', submenu: SubmenuMetas },
      meta: { rotaDeEscape: 'indicadorDaMeta', título: 'Editar valores realizados', tipoDeValor: 'realizado' },
    },

    // /////////////////////////////////////////////////////////////////////////

    { path: ':meta_id/painel', component: SinglePainelMeta, props: { submenu: SubmenuMetas } },
    { path: ':meta_id/evolucao', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
    { path: ':meta_id/evolucao/:indicador_id', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
    { path: ':meta_id/evolucao/:indicador_id/variaveis/novo', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
    { path: ':meta_id/evolucao/:indicador_id/variaveis/novo/:copy_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
    { path: ':meta_id/evolucao/:indicador_id/variaveis/:var_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
    { path: ':meta_id/evolucao/:indicador_id/variaveis/:var_id/valores', component: SingleEvolucao, props: { group: 'valores', submenu: SubmenuMetas } },
    { path: ':meta_id/evolucao/:indicador_id/variaveis/:var_id/retroativos', component: SingleEvolucao, props: { group: 'retroativos', submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma', component: SingleCronograma, props: { submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/novo', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/:cronograma_id', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/:cronograma_id/etapas/novo', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/novo', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/:cronograma_id/monitorar/iniciativa', component: SingleCronograma, props: { group: 'monitorar', recorte: 'iniciativa', submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/:cronograma_id/monitorar/atividade', component: SingleCronograma, props: { group: 'monitorar', recorte: 'atividade', submenu: SubmenuMetas } },
    { path: ':meta_id/cronograma/:cronograma_id/monitorar/:etapa_id', component: SingleCronograma, props: { group: 'monitorar', submenu: SubmenuMetas } },

    {
      path: ':meta_id/orcamento',
      redirect: (to) => `${to.path}/custo`,
      component: MetaOrçamentoRaiz,
      props: { submenu: SubmenuMetas },
      meta: {
        // como o componente é compartilhado, ele deveria
        // se atualizar em mudanças de rota
        rotaPrescindeDeChave: false,
      },
      children: [
        {
          path: 'custo',
          name: 'MetaOrcamentoCusto',
          component: MetaOrcamento,
          props: { submenu: SubmenuMetas, area: 'Custo', title: 'Previsão de Custo' },
        },
        {
          path: 'custo/:ano',
          component: AddEditCusteio,
          props: { submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'MetaOrcamentoCusto' },
        },
        {
          path: 'custo/:ano/:id',
          component: AddEditCusteio,
          props: { submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'MetaOrcamentoCusto' },
        },
        {
          path: 'planejado',
          name: 'MetaOrcamentoPlanejado',
          component: MetaOrcamento,
          props: { submenu: SubmenuMetas, area: 'Planejado', title: 'Orçamento Planejado' },
        },
        {
          path: 'planejado/:ano',
          component: AddEditPlanejado,
          props: { submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'MetaOrcamentoPlanejado' },
        },
        {
          path: 'planejado/:ano/:id',
          component: AddEditPlanejado,
          props: { submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'MetaOrcamentoPlanejado' },
        },

        {
          path: 'realizado',
          name: 'MetaOrcamentoRealizado',
          component: MetaOrcamento,
          props: { submenu: SubmenuMetas, area: 'Realizado', title: 'Execução orçamentária' },
        },
        {
          path: 'realizado/:ano/dotacao',
          component: AddRealizado,
          props: { submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'MetaOrcamentoRealizado' },
        },
        {
          path: 'realizado/:ano/processo',
          component: AddRealizadoProcesso,
          props: { submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'MetaOrcamentoRealizado' },
        },
        {
          path: 'realizado/:ano/nota',
          component: AddRealizadoNota,
          props: { submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'MetaOrcamentoRealizado' },
        },
        {
          path: 'realizado/:ano/:id',
          component: EditRealizado,
          props: { submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'MetaOrcamentoRealizado' },
        },
        {
          path: 'realizado/:ano/dotacao/:id',
          component: EditRealizado,
          props: { submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'MetaOrcamentoRealizado' },
        },
      ],
    },

    {
      path: ':meta_id/iniciativas',
      children: [
        { path: '', component: SingleMeta, props: { submenu: SubmenuMetas } },
        { path: 'novo', component: AddEditIniciativa, props: { submenu: SubmenuMetas } },
        { path: 'editar/:iniciativa_id', component: AddEditIniciativa, props: { submenu: SubmenuMetas } },
        { path: ':iniciativa_id', component: SingleIniciativa, props: { submenu: SubmenuMetas } },
        { path: ':iniciativa_id/indicadores/novo', component: AddEditIndicador, props: { submenu: SubmenuMetas } },
        {
          path: ':iniciativa_id/indicadores/:indicador_id', component: AddEditIndicador, props: { submenu: SubmenuMetas }, name: 'indicadorDaIniciativa',
        },
        { path: ':iniciativa_id/indicadores/:indicador_id/variaveis/novo', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/indicadores/:indicador_id/variaveis/novo/:copy_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },

        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis/gerar', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas }, meta: { funçãoDaTela: 'gerar', rotaDeEscape: 'indicadorDaIniciativa' },
        },

        { path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id/valores', component: AddEditIndicador, props: { group: 'valores', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id/retroativos', component: AddEditIndicador, props: { group: 'retroativos', submenu: SubmenuMetas } },

        // /////////////////////////////////////////////////////////////////////////
        // Variáveis compostas
        // /////////////////////////////////////////////////////////////////////////
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/novo',
          component: AddEditIndicador,
          props: { group: 'criar-ou-editar-variaveis-compostas', submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'indicadorDaIniciativa', título: 'Nova variável composta' },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/gerar',
          component: AddEditIndicador,
          props: { group: 'gerar-compostas', submenu: SubmenuMetas },
          meta: { funçãoDaTela: 'gerar', rotaDeEscape: 'indicadorDaIniciativa', título: 'Auxiliar de variável composta' },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/:var_id',
          component: AddEditIndicador,
          props: { group: 'criar-ou-editar-variaveis-compostas', submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'indicadorDaIniciativa', título: 'Editar variável composta' },
        },

        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/:var_id/valores',
          component: AddEditIndicador,
          props: { group: 'compostas-valores', submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'indicadorDaIniciativa', título: 'Editar valores previstos', tipoDeValor: 'previsto' },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/:var_id/retroativos',
          component: AddEditIndicador,
          props: { group: 'compostas-retroativos', submenu: SubmenuMetas },
          meta: { rotaDeEscape: 'indicadorDaIniciativa', título: 'Editar valores realizados', tipoDeValor: 'realizado' },
        },

        // /////////////////////////////////////////////////////////////////////////

        { path: ':iniciativa_id/evolucao', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
        { path: ':iniciativa_id/evolucao/:indicador_id', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
        { path: ':iniciativa_id/evolucao/:indicador_id/variaveis/novo', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/evolucao/:indicador_id/variaveis/novo/:copy_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/evolucao/:indicador_id/variaveis/:var_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/evolucao/:indicador_id/variaveis/:var_id/valores', component: SingleEvolucao, props: { group: 'valores', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/evolucao/:indicador_id/variaveis/:var_id/retroativos', component: SingleEvolucao, props: { group: 'retroativos', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma', component: SingleCronograma, props: { submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma/novo', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma/:cronograma_id', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/novo', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/novo', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma/:cronograma_id/monitorar/atividade', component: SingleCronograma, props: { group: 'monitorar', recorte: 'atividade', submenu: SubmenuMetas } },
        { path: ':iniciativa_id/cronograma/:cronograma_id/monitorar/:etapa_id', component: SingleCronograma, props: { group: 'monitorar', submenu: SubmenuMetas } },
        {
          path: ':iniciativa_id/atividades',
          children: [
            { path: '', component: SingleIniciativa, props: { submenu: SubmenuMetas } },
            { path: 'novo', component: AddEditAtividade, props: { submenu: SubmenuMetas } },
            { path: 'editar/:atividade_id', component: AddEditAtividade, props: { submenu: SubmenuMetas } },
            { path: ':atividade_id', component: SingleAtividade, props: { submenu: SubmenuMetas } },
            { path: ':atividade_id/indicadores/novo', component: AddEditIndicador, props: { submenu: SubmenuMetas } },
            {
              path: ':atividade_id/indicadores/:indicador_id', component: AddEditIndicador, props: { submenu: SubmenuMetas }, name: 'indicadorDaAtividade',
            },
            { path: ':atividade_id/indicadores/:indicador_id/variaveis/novo', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },

            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis/gerar',
              component: AddEditIndicador,
              props: { group: 'variaveis', submenu: SubmenuMetas },
              meta: { funçãoDaTela: 'gerar', rotaDeEscape: 'indicadorDaAtividade' },
            },

            { path: ':atividade_id/indicadores/:indicador_id/variaveis/novo/:copy_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id', component: AddEditIndicador, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id/valores', component: AddEditIndicador, props: { group: 'valores', submenu: SubmenuMetas } },
            { path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id/retroativos', component: AddEditIndicador, props: { group: 'retroativos', submenu: SubmenuMetas } },

            // /////////////////////////////////////////////////////////////////////////
            // Variáveis compostas
            // /////////////////////////////////////////////////////////////////////////
            // PRA-FAZER: organizar essas rotas para remover esse código duplicado
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/novo',
              component: AddEditIndicador,
              props: { group: 'criar-ou-editar-variaveis-compostas', submenu: SubmenuMetas },
              meta: { rotaDeEscape: 'indicadorDaAtividade', título: 'Nova variável composta' },
            },
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/gerar',
              component: AddEditIndicador,
              props: { group: 'gerar-compostas', submenu: SubmenuMetas },
              meta: { funçãoDaTela: 'gerar', rotaDeEscape: 'indicadorDaAtividade', título: 'Auxiliar de variável composta' },
            },
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/:var_id',
              component: AddEditIndicador,
              props: { group: 'criar-ou-editar-variaveis-compostas', submenu: SubmenuMetas },
              meta: { rotaDeEscape: 'indicadorDaAtividade', título: 'Editar variável composta' },
            },

            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/:var_id/valores',
              component: AddEditIndicador,
              props: { group: 'compostas-valores', submenu: SubmenuMetas },
              meta: { rotaDeEscape: 'indicadorDaAtividade', título: 'Editar valores previstos', tipoDeValor: 'previsto' },
            },
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/:var_id/retroativos',
              component: AddEditIndicador,
              props: { group: 'compostas-retroativos', submenu: SubmenuMetas },
              meta: { rotaDeEscape: 'indicadorDaAtividade', título: 'Editar valores realizados', tipoDeValor: 'realizado' },
            },

            // /////////////////////////////////////////////////////////////////////////

            { path: ':atividade_id/evolucao', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
            { path: ':atividade_id/evolucao/:indicador_id', component: SingleEvolucao, props: { submenu: SubmenuMetas } },
            { path: ':atividade_id/evolucao/:indicador_id/variaveis/novo', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':atividade_id/evolucao/:indicador_id/variaveis/novo/:copy_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':atividade_id/evolucao/:indicador_id/variaveis/:var_id', component: SingleEvolucao, props: { group: 'variaveis', submenu: SubmenuMetas } },
            { path: ':atividade_id/evolucao/:indicador_id/variaveis/:var_id/valores', component: SingleEvolucao, props: { group: 'valores', submenu: SubmenuMetas } },
            { path: ':atividade_id/evolucao/:indicador_id/variaveis/:var_id/retroativos', component: SingleEvolucao, props: { group: 'retroativos', submenu: SubmenuMetas } },
            { path: ':atividade_id/cronograma', component: SingleCronograma, props: { submenu: SubmenuMetas } },
            { path: ':atividade_id/cronograma/novo', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
            { path: ':atividade_id/cronograma/:cronograma_id', component: AddEditCronograma, props: { submenu: SubmenuMetas } },
            { path: ':atividade_id/cronograma/:cronograma_id/etapas/novo', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
            { path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id', component: SingleCronograma, props: { group: 'etapas', submenu: SubmenuMetas } },
            { path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/novo', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
            { path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id', component: SingleCronograma, props: { group: 'fase', submenu: SubmenuMetas } },
            { path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
            { path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id', component: SingleCronograma, props: { group: 'subfase', submenu: SubmenuMetas } },
          ],
        },
      ],
    },
  ],
};

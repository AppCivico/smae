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
  SingleMeta,
  SinglePainelMeta,
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

const rotasParaMenuSecundário = (nível) => {
  let rotasDoPdm = [];
  let rotasDoOrçamento = [];

  switch (nível) {
    case 'atividade':
      rotasDoPdm = [
        'planoSetorial:resumoDeAtividade',
        'planoSetorial:evoluçãoDaAtividade',
        'planoSetorial:cronogramaDaAtividade',
      ];
      break;

    case 'iniciativa':
      rotasDoPdm = [
        'planoSetorial:resumoDeIniciativa',
        'planoSetorial:evoluçãoDaIniciativa',
        'planoSetorial:cronogramaDaIniciativa',
      ];
      break;

    case 'meta':
    default:
      rotasDoPdm = [
        'planoSetorial:meta',
        'planoSetorial:painelDaMeta',
        'planoSetorial:evoluçãoDaMeta',
        'planoSetorial:cronogramaDaMeta',
      ];
      rotasDoOrçamento = [
        'planoSetorial:MetaOrcamentoCusto',
        'planoSetorial:MetaOrcamentoPlanejado',
        'planoSetorial:MetaOrcamentoRealizado',
      ];
      break;
  }

  return [
    {
      título: 'Programa de Metas',
      rotas: rotasDoPdm,
    },
    {
      título: 'Visão orçamentária',
      rotas: rotasDoOrçamento,
    },
  ];
};

export default [
  {
    path: '',
    name: 'planosSetoriaisMetas',
    component: ListMetas,
  },
  {
    path: 'novo',
    name: 'planoSetorial:novaMeta',
    component: AddEditMetas,
    props: { type: 'novo', parentPage: 'metas' },
  },
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
  {
    path: ':meta_id',
    name: 'planoSetorial:meta',
    component: SingleMeta,
    meta: {
      títuloParaMenu: 'Resumo',
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/indicadores/novo',
    component: AddEditIndicador,
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/indicadores/:indicador_id',
    component: AddEditIndicador,
    name: 'planoSetorial:indicadorDaMeta',
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },

  {
    path: ':meta_id/indicadores/:indicador_id/variaveis/novo',
    component: AddEditIndicador,
    props: { group: 'variaveis' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },

  {
    path: ':meta_id/indicadores/:indicador_id/variaveis/gerar',
    component: AddEditIndicador,
    props: { group: 'variaveis' },
    meta: {
      funçãoDaTela: 'gerar',
      rotaDeEscape: 'indicadorDaMeta',
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },

  {
    path: ':meta_id/indicadores/:indicador_id/variaveis/novo/:copy_id',
    component: AddEditIndicador,
    props: { group: 'variaveis' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id',
    component: AddEditIndicador,
    props: { group: 'variaveis' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id/valores',
    component: AddEditIndicador,
    props: { group: 'valores' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id/retroativos',
    component: AddEditIndicador,
    props: { group: 'retroativos' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },

  // /////////////////////////////////////////////////////////////////////////
  // Variáveis compostas
  // /////////////////////////////////////////////////////////////////////////
  {
    path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/novo',
    component: AddEditIndicador,
    props: { group: 'criar-ou-editar-variaveis-compostas' },
    meta: {
      rotaDeEscape: 'indicadorDaMeta',
      título: 'Nova variável composta',
      rotaPrescindeDeChave: true,
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/gerar',
    component: AddEditIndicador,
    props: { group: 'gerar-compostas' },
    meta: {
      funçãoDaTela: 'gerar',
      rotaDeEscape: 'indicadorDaMeta',
      título: 'Auxiliar de variável composta',
      rotaPrescindeDeChave: true,
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/:var_id',
    component: AddEditIndicador,
    props: { group: 'criar-ou-editar-variaveis-compostas' },
    meta: {
      rotaDeEscape: 'indicadorDaMeta',
      título: 'Editar variável composta',
      rotaPrescindeDeChave: true,
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },

  {
    path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/:var_id/valores',
    component: AddEditIndicador,
    props: { group: 'compostas-valores' },
    meta: {
      rotaDeEscape: 'indicadorDaMeta',
      título: 'Editar valores previstos',
      tipoDeValor: 'previsto',
      rotaPrescindeDeChave: true,
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/:var_id/retroativos',
    component: AddEditIndicador,
    props: { group: 'compostas-retroativos' },
    meta: {
      rotaDeEscape: 'indicadorDaMeta',
      título: 'Editar valores realizados',
      tipoDeValor: 'realizado',
      rotaPrescindeDeChave: true,
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },

  // /////////////////////////////////////////////////////////////////////////

  {
    path: ':meta_id/painel',
    name: 'planoSetorial:painelDaMeta',
    component: SinglePainelMeta,
    meta: {
      títuloParaMenu: 'Painel da meta',
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/evolucao',
    name: 'planoSetorial:evoluçãoDaMeta',
    component: SingleEvolucao,
    meta: {
      títuloParaMenu: 'Evolução',
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/evolucao/:indicador_id',
    component: SingleEvolucao,
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/evolucao/:indicador_id/variaveis/novo',
    component: SingleEvolucao,
    props: { group: 'variaveis' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/evolucao/:indicador_id/variaveis/novo/:copy_id',
    component: SingleEvolucao,
    props: { group: 'variaveis' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/evolucao/:indicador_id/variaveis/:var_id',
    component: SingleEvolucao,
    props: { group: 'variaveis' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/evolucao/:indicador_id/variaveis/:var_id/valores',
    component: SingleEvolucao,
    props: { group: 'valores' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/evolucao/:indicador_id/variaveis/:var_id/retroativos',
    component: SingleEvolucao,
    props: { group: 'retroativos' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma',
    name: 'planoSetorial:cronogramaDaMeta',
    component: SingleCronograma,
    meta: {
      títuloParaMenu: 'Cronograma',
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/novo',
    component: AddEditCronograma,
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/:cronograma_id',
    component: AddEditCronograma,
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/:cronograma_id/etapas/novo',
    component: SingleCronograma,
    props: { group: 'etapas' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id',
    component: SingleCronograma,
    props: { group: 'etapas' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/novo',
    component: SingleCronograma,
    props: { group: 'fase' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id',
    component: SingleCronograma,
    props: { group: 'fase' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo',
    component: SingleCronograma,
    props: { group: 'subfase' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id',
    component: SingleCronograma,
    props: { group: 'subfase' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/:cronograma_id/monitorar/iniciativa',
    component: SingleCronograma,
    props: { group: 'monitorar', recorte: 'iniciativa' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/:cronograma_id/monitorar/atividade',
    component: SingleCronograma,
    props: { group: 'monitorar', recorte: 'atividade' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },
  {
    path: ':meta_id/cronograma/:cronograma_id/monitorar/:etapa_id',
    component: SingleCronograma,
    props: { group: 'monitorar' },
    meta: {
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
  },

  {
    path: ':meta_id/orcamento',
    redirect: (to) => `${to.path}/custo`,
    component: MetaOrçamentoRaiz,
    meta: {
      rotaPrescindeDeChave: true,
      rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
    },
    children: [
      {
        path: 'custo',
        name: 'planoSetorial:MetaOrcamentoCusto',
        component: MetaOrcamento,
        props: { area: 'Custo', title: 'Previsão de Custo' },
        meta: {
          títuloParaMenu: 'Previsão de custo',
          limitarÀsPermissões: 'CadastroMeta.orcamento',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'custo/:ano',
        component: AddEditCusteio,
        meta: {
          rotaDeEscape: 'MetaOrcamentoCusto',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'custo/:ano/:id',
        component: AddEditCusteio,
        meta: {
          rotaDeEscape: 'MetaOrcamentoCusto',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'planejado',
        name: 'planoSetorial:MetaOrcamentoPlanejado',
        component: MetaOrcamento,
        props: { area: 'Planejado', title: 'Orçamento Planejado' },
        meta: {
          títuloParaMenu: 'Orçamento planejado',
          limitarÀsPermissões: 'CadastroMeta.orcamento',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'planejado/:ano',
        component: AddEditPlanejado,
        meta: {
          rotaDeEscape: 'MetaOrcamentoPlanejado',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'planejado/:ano/:id',
        component: AddEditPlanejado,
        meta: {
          rotaDeEscape: 'MetaOrcamentoPlanejado',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },

      {
        path: 'realizado',
        name: 'planoSetorial:MetaOrcamentoRealizado',
        component: MetaOrcamento,
        props: { area: 'Realizado', title: 'Execução orçamentária' },
        meta: {
          títuloParaMenu: 'Execução orçamentária',
          limitarÀsPermissões: 'CadastroMeta.orcamento',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'realizado/:ano/dotacao',
        component: AddRealizado,
        meta: {
          rotaDeEscape: 'MetaOrcamentoRealizado',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'realizado/:ano/processo',
        component: AddRealizadoProcesso,
        meta: {
          rotaDeEscape: 'MetaOrcamentoRealizado',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'realizado/:ano/nota',
        component: AddRealizadoNota,
        meta: {
          rotaDeEscape: 'MetaOrcamentoRealizado',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'realizado/:ano/:id',
        component: EditRealizado,
        meta: {
          rotaDeEscape: 'MetaOrcamentoRealizado',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'realizado/:ano/dotacao/:id',
        component: EditRealizado,
        meta: {
          rotaDeEscape: 'MetaOrcamentoRealizado',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
    ],
  },

  {
    path: ':meta_id/iniciativas',
    children: [
      {
        path: '',
        component: SingleMeta,
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'novo',
        component: AddEditIniciativa,
        meta: {
          rotaDeEscape: 'planoSetorial:listaDeIniciativas',
          rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
        },
      },
      {
        path: 'editar/:iniciativa_id',
        component: AddEditIniciativa,
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id',
        name: 'planoSetorial:resumoDeIniciativa',
        component: SingleIniciativa,
        meta: {
          títuloParaMenu: 'Resumo',
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/indicadores/novo',
        component: AddEditIndicador,
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/indicadores/:indicador_id',
        name: 'planoSetorial:indicadorDaIniciativa',
        component: AddEditIndicador,
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis/novo',
        component: AddEditIndicador,
        props: { group: 'variaveis' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis/novo/:copy_id',
        component: AddEditIndicador,
        props: { group: 'variaveis' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },

      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis/gerar',
        component: AddEditIndicador,
        props: { group: 'variaveis' },
        meta: {
          funçãoDaTela: 'gerar',
          rotaDeEscape: 'indicadorDaIniciativa',
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },

      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id',
        component: AddEditIndicador,
        props: { group: 'variaveis' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id/valores',
        component: AddEditIndicador,
        props: { group: 'valores' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id/retroativos',
        component: AddEditIndicador,
        props: { group: 'retroativos' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },

      // /////////////////////////////////////////////////////////////////////////
      // Variáveis compostas
      // /////////////////////////////////////////////////////////////////////////
      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/novo',
        component: AddEditIndicador,
        props: { group: 'criar-ou-editar-variaveis-compostas' },
        meta: {
          rotaDeEscape: 'indicadorDaIniciativa',
          título: 'Nova variável composta',
          rotaPrescindeDeChave: true,
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/gerar',
        component: AddEditIndicador,
        props: { group: 'gerar-compostas' },
        meta: {
          funçãoDaTela: 'gerar',
          rotaDeEscape: 'indicadorDaIniciativa',
          título: 'Auxiliar de variável composta',
          rotaPrescindeDeChave: true,
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/:var_id',
        component: AddEditIndicador,
        props: { group: 'criar-ou-editar-variaveis-compostas' },
        meta: {
          rotaDeEscape: 'indicadorDaIniciativa',
          título: 'Editar variável composta',
          rotaPrescindeDeChave: true,
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },

      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/:var_id/valores',
        component: AddEditIndicador,
        props: { group: 'compostas-valores' },
        meta: {
          rotaDeEscape: 'indicadorDaIniciativa',
          título: 'Editar valores previstos',
          tipoDeValor: 'previsto',
          rotaPrescindeDeChave: true,
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/:var_id/retroativos',
        component: AddEditIndicador,
        props: { group: 'compostas-retroativos' },
        meta: {
          rotaDeEscape: 'indicadorDaIniciativa',
          título: 'Editar valores realizados',
          tipoDeValor: 'realizado',
          rotaPrescindeDeChave: true,
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },

      // /////////////////////////////////////////////////////////////////////////

      {
        path: ':iniciativa_id/evolucao',
        name: 'planoSetorial:evoluçãoDaIniciativa',
        component: SingleEvolucao,
        meta: {
          títuloParaMenu: 'Evolução',
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/evolucao/:indicador_id',
        component: SingleEvolucao,
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/evolucao/:indicador_id/variaveis/novo',
        component: SingleEvolucao,
        props: { group: 'variaveis' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/evolucao/:indicador_id/variaveis/novo/:copy_id',
        component: SingleEvolucao,
        props: { group: 'variaveis' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/evolucao/:indicador_id/variaveis/:var_id',
        component: SingleEvolucao,
        props: { group: 'variaveis' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/evolucao/:indicador_id/variaveis/:var_id/valores',
        component: SingleEvolucao,
        props: { group: 'valores' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/evolucao/:indicador_id/variaveis/:var_id/retroativos',
        component: SingleEvolucao,
        props: { group: 'retroativos' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma',
        name: 'planoSetorial:cronogramaDaIniciativa',
        component: SingleCronograma,
        meta: {
          títuloParaMenu: 'Cronograma',
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma/novo',
        component: AddEditCronograma,
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma/:cronograma_id',
        component: AddEditCronograma,
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma/:cronograma_id/etapas/novo',
        component: SingleCronograma,
        props: { group: 'etapas' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id',
        component: SingleCronograma,
        props: { group: 'etapas' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/novo',
        component: SingleCronograma,
        props: { group: 'fase' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id',
        component: SingleCronograma,
        props: { group: 'fase' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo',
        component: SingleCronograma,
        props: { group: 'subfase' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id',
        component: SingleCronograma,
        props: { group: 'subfase' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma/:cronograma_id/monitorar/atividade',
        component: SingleCronograma,
        props: { group: 'monitorar', recorte: 'atividade' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/cronograma/:cronograma_id/monitorar/:etapa_id',
        component: SingleCronograma,
        props: { group: 'monitorar' },
        meta: {
          rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
        },
      },
      {
        path: ':iniciativa_id/atividades',
        children: [
          {
            path: '',
            component: SingleIniciativa,
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
            },
          },
          {
            path: 'novo',
            component: AddEditAtividade,
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
            },
          },
          {
            path: 'editar/:atividade_id',
            component: AddEditAtividade,
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id',
            name: 'planoSetorial:resumoDeAtividade',
            component: SingleAtividade,
            meta: {
              títuloParaMenu: 'Resumo',
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/indicadores/novo',
            component: AddEditIndicador,
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/indicadores/:indicador_id',
            component: AddEditIndicador,
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
            name: 'planoSetorial:indicadorDaAtividade',
          },
          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis/novo',
            component: AddEditIndicador,
            props: { group: 'variaveis' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },

          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis/gerar',
            component: AddEditIndicador,
            props: { group: 'variaveis' },
            meta: {
              funçãoDaTela: 'gerar',
              rotaDeEscape: 'indicadorDaAtividade',
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },

          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis/novo/:copy_id',
            component: AddEditIndicador,
            props: { group: 'variaveis' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id',
            component: AddEditIndicador,
            props: { group: 'variaveis' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id/valores',
            component: AddEditIndicador,
            props: { group: 'valores' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id/retroativos',
            component: AddEditIndicador,
            props: { group: 'retroativos' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },

          // /////////////////////////////////////////////////////////////////////////
          // Variáveis compostas
          // /////////////////////////////////////////////////////////////////////////
          // PRA-FAZER: organizar essas rotas para remover esse código duplicado
          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/novo',
            component: AddEditIndicador,
            props: { group: 'criar-ou-editar-variaveis-compostas' },
            meta: {
              rotaDeEscape: 'indicadorDaAtividade',
              título: 'Nova variável composta',
              rotaPrescindeDeChave: true,
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/gerar',
            component: AddEditIndicador,
            props: { group: 'gerar-compostas' },
            meta: {
              funçãoDaTela: 'gerar',
              rotaDeEscape: 'indicadorDaAtividade',
              título: 'Auxiliar de variável composta',
              rotaPrescindeDeChave: true,
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/:var_id',
            component: AddEditIndicador,
            props: { group: 'criar-ou-editar-variaveis-compostas' },
            meta: {
              rotaDeEscape: 'indicadorDaAtividade',
              título: 'Editar variável composta',
              rotaPrescindeDeChave: true,
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },

          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/:var_id/valores',
            component: AddEditIndicador,
            props: { group: 'compostas-valores' },
            meta: {
              rotaDeEscape: 'indicadorDaAtividade',
              título: 'Editar valores previstos',
              tipoDeValor: 'previsto',
              rotaPrescindeDeChave: true,
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/:var_id/retroativos',
            component: AddEditIndicador,
            props: { group: 'compostas-retroativos' },
            meta: {
              rotaDeEscape: 'indicadorDaAtividade',
              título: 'Editar valores realizados',
              tipoDeValor: 'realizado',
              rotaPrescindeDeChave: true,
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },

          // /////////////////////////////////////////////////////////////////////////

          {
            path: ':atividade_id/evolucao',
            name: 'planoSetorial:evoluçãoDaAtividade',
            component: SingleEvolucao,
            meta: {
              títuloParaMenu: 'Evolução',
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/evolucao/:indicador_id',
            component: SingleEvolucao,
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/evolucao/:indicador_id/variaveis/novo',
            component: SingleEvolucao,
            props: { group: 'variaveis' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/evolucao/:indicador_id/variaveis/novo/:copy_id',
            component: SingleEvolucao,
            props: { group: 'variaveis' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/evolucao/:indicador_id/variaveis/:var_id',
            component: SingleEvolucao,
            props: { group: 'variaveis' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/evolucao/:indicador_id/variaveis/:var_id/valores',
            component: SingleEvolucao,
            props: { group: 'valores' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/evolucao/:indicador_id/variaveis/:var_id/retroativos',
            component: SingleEvolucao,
            props: { group: 'retroativos' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/cronograma',
            name: 'planoSetorial:cronogramaDaAtividade',
            component: SingleCronograma,
            meta: {
              títuloParaMenu: 'Cronograma',
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/cronograma/novo',
            component: AddEditCronograma,
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/cronograma/:cronograma_id',
            component: AddEditCronograma,
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/cronograma/:cronograma_id/etapas/novo',
            component: SingleCronograma,
            props: { group: 'etapas' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id',
            component: SingleCronograma,
            props: { group: 'etapas' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/novo',
            component: SingleCronograma,
            props: { group: 'fase' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id',
            component: SingleCronograma,
            props: { group: 'fase' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo',
            component: SingleCronograma,
            props: { group: 'subfase' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
          {
            path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id',
            component: SingleCronograma,
            props: { group: 'subfase' },
            meta: {
              rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
            },
          },
        ],
      },
    ],
  },
];

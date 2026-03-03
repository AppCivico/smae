import type { RouteLocation } from 'vue-router';
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store';

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

import type { TiposDeOrcamentosDisponiveis } from '@/stores/planosSetoriais.store';
import AddEditEtapa from '@/views/metas/AddEditEtapa.vue';
import EditarFaseCronograma from '@/views/metas/EditarFaseCronograma/EditarFaseCronograma.vue';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import tiparPropsDeRota from '../helpers/tiparPropsDeRota';
import type {
  EntidadesPossiveis,
  ParametrosPagina,
} from './prepararRotasParaPlanejamentoEMonitoramento';

declare module 'vue-router' {
  interface RouteMeta {
    rotaDeAdicao?: string;
    'rotaDeAdicao.etapa'?: string;
    'rotaDeEdicao.etapa'?: string;
    'rotaDeAdicao.fase'?: string;
    'rotaDeEdicao.fase'?: string;
    'rotaDeAdicao.subfase'?: string;
    'rotaDeEdicao.subfase'?: string;
  }
}

type Props = {
  entidadeMãe: EntidadesPossiveis;
  parametrosPagina: ParametrosPagina;
};

export default ({ entidadeMãe, parametrosPagina }: Props) => {
  type Nível = 'atividade' | 'iniciativa' | 'meta';

  const rotasParaMenuSecundário = (
    nível: Nível,
    orcamentosDisponiveis: TiposDeOrcamentosDisponiveis = {},
  ) => {
    let rotasDoPdm = [];
    const rotasDoOrçamento = [];

    switch (nível) {
      case 'atividade':
        rotasDoPdm = [
          `${entidadeMãe}.resumoDeAtividade`,
          `${entidadeMãe}.evoluçãoDaAtividade`,
          `${entidadeMãe}.anexosDaAtividade`,
          `${entidadeMãe}.cronogramaDaAtividade`,
        ];
        break;

      case 'iniciativa':
        rotasDoPdm = [
          `${entidadeMãe}.resumoDeIniciativa`,
          `${entidadeMãe}.evoluçãoDaIniciativa`,
          `${entidadeMãe}.anexosDaIniciativa`,
          `${entidadeMãe}.cronogramaDaIniciativa`,
        ];
        break;

      case 'meta':
      default:
        rotasDoPdm = [
          `${entidadeMãe}.meta`,
          `${entidadeMãe}.evoluçãoDaMeta`,
          `${entidadeMãe}.monitoramentoDeMetas`,
          `${entidadeMãe}.anexosDaMeta`,
          `${entidadeMãe}.cronogramaDaMeta`,
        ];

        if (orcamentosDisponiveis.previsao_custo_disponivel) {
          rotasDoOrçamento.push(`${entidadeMãe}.MetaOrcamentoCusto`);
        }
        if (orcamentosDisponiveis.planejado_disponivel) {
          rotasDoOrçamento.push(`${entidadeMãe}.MetaOrcamentoPlanejado`);
        }

        if (orcamentosDisponiveis.execucao_disponivel) {
          rotasDoOrçamento.push(`${entidadeMãe}.MetaOrcamentoRealizado`);
        }

        break;
    }

    return rotasDoOrçamento.length
      ? [
        {
          título: `Metas do ${parametrosPagina.tituloSingular}`,
          rotas: rotasDoPdm,
        },
        {
          título: 'Visão orçamentária',
          rotas: rotasDoOrçamento,
        },
      ]
      : [
        {
          título: `Metas do ${parametrosPagina.tituloSingular}`,
          rotas: rotasDoPdm,
        },
      ];
  };

  return [
    {
      path: '',
      name: `${entidadeMãe}.listaDeMetas`,
      component: ListMetas,
      meta: {
        limitarÀsPermissões: [
          'CadastroPS.administrador_no_orgao',
          'CadastroPS.administrador',
          'Menu.metas',
          'ReferencialEm.Equipe.PS',
        ],
      },
    },
    {
      path: 'novo',
      name: `${entidadeMãe}.novaMeta`,
      component: AddEditMetas,
      props: { type: 'novo', parentPage: 'metas' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.listaDeMetas`,
      },
    },
    {
      path: 'editar/:meta_id',
      name: `${entidadeMãe}.editarMeta`,
      component: AddEditMetas,
      props: { type: 'editar', parentPage: 'metas' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.meta`,
      },
    },
    {
      path: 'macrotemas/:id',
      name: `${entidadeMãe}.macrotemas`,
      component: ListMetasGroup,
      props: { type: 'list', group: 'macro_tema', parentPage: 'metas' },
    },
    {
      path: 'macrotemas/:macro_tema_id/novo',
      name: `${entidadeMãe}.macrotemas.novo`,
      component: AddEditMetas,
      props: { type: 'novo', group: 'macro_tema', parentPage: 'metas' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.listaDeMetas`,
      },
    },
    {
      path: 'subtemas/:id',
      name: `${entidadeMãe}.subtemas`,
      component: ListMetasGroup,
      props: { type: 'list', group: 'sub_tema', parentPage: 'metas' },
    },
    {
      path: 'subtemas/:sub_tema_id/novo',
      name: `${entidadeMãe}.subtemas.novo`,
      component: AddEditMetas,
      props: { type: 'novo', group: 'sub_tema', parentPage: 'metas' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.listaDeMetas`,
      },
    },
    {
      path: 'temas/:id',
      name: `${entidadeMãe}.temas`,
      component: ListMetasGroup,
      props: { type: 'list', group: 'tema', parentPage: 'metas' },
    },
    {
      path: 'temas/:tema_id/novo',
      name: `${entidadeMãe}.temas.novo`,
      component: AddEditMetas,
      props: { type: 'novo', group: 'tema', parentPage: 'metas' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.listaDeMetas`,
      },
    },
    {
      path: 'tags/:id',
      name: `${entidadeMãe}.tags`,
      component: ListMetasGroup,
      props: { type: 'list', group: 'tags', parentPage: 'metas' },
    },
    {
      path: ':meta_id',
      meta: {
        títuloParaMenu: 'Resumo',
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
      children: [
        {
          name: `${entidadeMãe}.meta`,
          path: '',
          component: SingleMeta,
        },
        {
          path: 'monitoramento',
          name: `${entidadeMãe}.monitoramentoDaMeta`,
          meta: {
            título: 'Histórico de Monitoramento',
            títuloParaMenu: undefined,
            limitarÀsPermissões: [
              'Menu.historico_monitoramento_ps',
              'Menu.historico_monitoramento_pdm',
            ],
          },
          children: [
            {
              name: `${entidadeMãe}.monitoramentoDeMetas`,
              path: '',
              component: () => import('@/views/monitoramentoDeMetas/MonitoramentoDeMetasLista.vue'),
            },
            {
              name: `${entidadeMãe}.monitoramentoDeMetasAnaliseDeRisco`,
              path: 'analise-de-risco/:cicloId',
              meta: {
                título: 'Análise de Risco',
                títuloParaMenu: undefined,
                rotaDeEscape: `${entidadeMãe}.monitoramentoDeMetas`,
              },
              component: () => import('@/views/monitoramentoDeMetas/MonitoramentoDeMetasAnaliseDeRisco.vue'),
            },
            {
              name: `${entidadeMãe}.monitoramentoDeMetasRegistroDeFechamento`,
              path: 'registro-de-fechamento/:cicloId',
              meta: {
                título: 'Registro de Fechamento',
                títuloParaMenu: undefined,
                rotaDeEscape: `${entidadeMãe}.monitoramentoDeMetas`,
              },
              component: () => import('@/views/monitoramentoDeMetas/MonitoramentoDeMetasRegistroDeFechamento.vue'),
            },
            {
              name: `${entidadeMãe}.monitoramentoDeMetasAnaliseQualitativa`,
              path: 'analise-qualitativa/:cicloId',
              meta: {
                título: 'Análise Qualitativa',
                títuloParaMenu: undefined,
                rotaDeEscape: `${entidadeMãe}.monitoramentoDeMetas`,
              },
              component: () => import('@/views/monitoramentoDeMetas/MonitoramentoDeMetasAnaliseQualitativa.vue'),
            },
          ],
        },
      ],
    },
    {
      name: `${entidadeMãe}.anexosDaMeta`,
      path: ':meta_id/anexos',
      component: () => import('@/views/metas/AnexosDasVariaveis.vue'),
      props: tiparPropsDeRota,
      meta: {
        títuloParaMenu: 'Anexos',
        título: 'Anexos das variáveis da meta',
        rotasParaMenuSecundário: rotasParaMenuSecundário('meta'),
      },
    },
    {
      path: ':meta_id/indicadores/novo',
      name: `${entidadeMãe}.indicadorDaMeta.novo`,
      component: AddEditIndicador,
      meta: {
        rotaDeEscape: `${entidadeMãe}.meta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/indicadores/:indicador_id',
      component: AddEditIndicador,
      name: `${entidadeMãe}.indicadorDaMeta`,
      meta: {
        rotaDeEscape: `${entidadeMãe}.meta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },

    {
      path: ':meta_id/indicadores/:indicador_id/variaveis/novo',
      name: `${entidadeMãe}.indicadorDaMeta.variavel.novo`,
      component: AddEditIndicador,
      props: { group: 'variaveis' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },

    {
      path: ':meta_id/indicadores/:indicador_id/variaveis/gerar',
      name: `${entidadeMãe}.indicadorDaMeta.variavel.gerar`,
      component: AddEditIndicador,
      props: { group: 'variaveis' },
      meta: {
        funçãoDaTela: 'gerar',
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },

    {
      path: ':meta_id/indicadores/:indicador_id/variaveis/novo/:copy_id',
      name: `${entidadeMãe}.indicadorDaMeta.variavel.copiar`,
      component: AddEditIndicador,
      props: { group: 'variaveis' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id',
      name: `${entidadeMãe}.indicadorDaMeta.variavel`,
      component: AddEditIndicador,
      props: { group: 'variaveis' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id/valores',
      name: `${entidadeMãe}.indicadorDaMeta.variavel.valores`,
      component: AddEditIndicador,
      props: { group: 'valores' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis/:var_id/retroativos',
      name: `${entidadeMãe}.indicadorDaMeta.variavel.retroativos`,
      component: AddEditIndicador,
      props: { group: 'retroativos' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },

    // /////////////////////////////////////////////////////////////////////////
    // Variáveis compostas
    // /////////////////////////////////////////////////////////////////////////
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/novo',
      name: `${entidadeMãe}.indicadorDaMeta.variavelComposta.novo`,
      component: AddEditIndicador,
      props: { group: 'criar-ou-editar-variaveis-compostas' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        título: 'Nova variável composta',
        rotaPrescindeDeChave: true,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/gerar',
      name: `${entidadeMãe}.indicadorDaMeta.variavelComposta.gerar`,
      component: AddEditIndicador,
      props: { group: 'gerar-compostas' },
      meta: {
        funçãoDaTela: 'gerar',
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        título: 'Auxiliar de variável composta',
        rotaPrescindeDeChave: true,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/:var_id',
      name: `${entidadeMãe}.indicadorDaMeta.variavelComposta`,
      component: AddEditIndicador,
      props: { group: 'criar-ou-editar-variaveis-compostas' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        título: 'Editar variável composta',
        rotaPrescindeDeChave: true,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },

    {
      path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/:var_id/valores',
      name: `${entidadeMãe}.indicadorDaMeta.variavelComposta.valores`,
      component: AddEditIndicador,
      props: { group: 'compostas-valores' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        título: 'Editar valores previstos',
        tipoDeValor: 'previsto',
        rotaPrescindeDeChave: true,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/indicadores/:indicador_id/variaveis-compostas/:var_id/retroativos',
      name: `${entidadeMãe}.indicadorDaMeta.variavelComposta.retroativos`,
      component: AddEditIndicador,
      props: { group: 'compostas-retroativos' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.indicadorDaMeta`,
        título: 'Editar valores realizados',
        tipoDeValor: 'realizado',
        rotaPrescindeDeChave: true,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },

    // /////////////////////////////////////////////////////////////////////////

    {
      path: ':meta_id/evolucao',
      name: `${entidadeMãe}.evoluçãoDaMeta`,
      component: SingleEvolucao,
      meta: {
        títuloParaMenu: 'Evolução',
        rotaPrescindeDeChave: true,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
      children: [
        {
          path: ':indicador_id',
          name: `${entidadeMãe}.evolucaoDoIndicador`,
          meta: {
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          path: ':indicador_id/variaveis/novo',
          name: `${entidadeMãe}.evoluçãoDaMeta.variavel.novo`,
          meta: {
            group: 'variaveis',
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          path: ':indicador_id/variaveis/novo/:copy_id',
          name: `${entidadeMãe}.evoluçãoDaMeta.variavel.copiar`,
          meta: {
            group: 'variaveis',
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          path: ':indicador_id/variaveis/:var_id',
          name: `${entidadeMãe}.evoluçãoDaMeta.variavel`,
          meta: {
            group: 'variaveis',
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          path: ':indicador_id/variaveis/:var_id/valores',
          name: `${entidadeMãe}.evoluçãoDaMeta.variavel.valores`,
          meta: {
            group: 'valores',
            rotaDeEscape: `${entidadeMãe}.evolucaoDoIndicador`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          path: ':indicador_id/variaveis/:var_id/retroativos',
          name: `${entidadeMãe}.evoluçãoDaMeta.variavel.retroativos`,
          meta: {
            group: 'retroativos',
            rotaDeEscape: `${entidadeMãe}.evolucaoDoIndicador`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
      ],
    },
    {
      path: ':meta_id/cronograma',
      name: `${entidadeMãe}.cronogramaDaMeta`,
      component: SingleCronograma,
      meta: {
        títuloParaMenu: 'Cronograma',
        rotaDeAdicao: `${entidadeMãe}.cronogramaDaMeta.novo`,
        'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronograma.novo`,
        'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronograma`,
        'rotaDeAdicao.fase': `${entidadeMãe}.faseCronograma.novo`,
        'rotaDeEdicao.fase': `${entidadeMãe}.faseCronograma.editar`,
        'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronograma.novo`,
        'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronograma.editar`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/cronograma/novo',
      name: `${entidadeMãe}.cronogramaDaMeta.novo`,
      component: AddEditCronograma,
      meta: {
        rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/cronograma/:cronograma_id',
      name: `${entidadeMãe}.cronogramaDaMeta.editar`,
      component: AddEditCronograma,
      meta: {
        rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/cronograma/:cronograma_id/etapas/novo',
      name: `${entidadeMãe}.etapaCronograma.novo`,
      component: AddEditEtapa,
      props: { group: 'etapas' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/cronograma/:cronograma_id/etapas/:etapa_id',
      children: [
        {
          path: '',
          name: `${entidadeMãe}.etapaCronograma`,
          component: AddEditEtapa,
          props: { group: 'etapas' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          path: ':fase_id',
          children: [
            {
              path: '',
              name: `${entidadeMãe}.faseCronograma.editar`,
              component: EditarFaseCronograma,
              props: { group: 'fase' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
                rotasParaMenuSecundário: () => rotasParaMenuSecundário(
                  'meta',
                  usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
                ),
              },
            },
            {
              path: ':subfase_id',
              name: `${entidadeMãe}.subfaseCronograma.editar`,
              component: EditarFaseCronograma,
              props: { group: 'subfase' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
                rotasParaMenuSecundário: () => rotasParaMenuSecundário(
                  'meta',
                  usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
                ),
              },
            },
            {
              path: 'novo',
              name: `${entidadeMãe}.subfaseCronograma.novo`,
              component: EditarFaseCronograma,
              props: { group: 'subfase' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
                rotasParaMenuSecundário: () => rotasParaMenuSecundário(
                  'meta',
                  usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
                ),
              },
            },
          ],
        },
        {
          path: 'novo',
          name: `${entidadeMãe}.faseCronograma.novo`,
          component: EditarFaseCronograma,
          props: { group: 'fase' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
      ],
    },
    {
      path: ':meta_id/cronograma/:cronograma_id/monitorar/iniciativa',
      name: `${entidadeMãe}.cronogramaDaMeta.monitorar.iniciativa`,
      component: SingleCronograma,
      props: { group: 'monitorar', recorte: 'iniciativa' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
        rotaDeAdicao: `${entidadeMãe}.cronogramaDaMeta.novo`,
        'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronograma.novo`,
        'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronograma`,
        'rotaDeAdicao.fase': `${entidadeMãe}.faseCronograma.novo`,
        'rotaDeEdicao.fase': `${entidadeMãe}.faseCronograma.editar`,
        'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronograma.novo`,
        'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronograma.editar`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/cronograma/:cronograma_id/monitorar/atividade',
      name: `${entidadeMãe}.cronogramaDaMeta.monitorar.atividade`,
      component: SingleCronograma,
      props: { group: 'monitorar', recorte: 'atividade' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
        rotaDeAdicao: `${entidadeMãe}.cronogramaDaMeta.novo`,
        'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronograma.novo`,
        'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronograma`,
        'rotaDeAdicao.fase': `${entidadeMãe}.faseCronograma.novo`,
        'rotaDeEdicao.fase': `${entidadeMãe}.faseCronograma.editar`,
        'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronograma.novo`,
        'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronograma.editar`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },
    {
      path: ':meta_id/cronograma/:cronograma_id/monitorar/:etapa_id',
      name: `${entidadeMãe}.cronogramaDaMeta.monitorar.etapa`,
      component: SingleCronograma,
      props: { group: 'monitorar' },
      meta: {
        rotaDeEscape: `${entidadeMãe}.cronogramaDaMeta`,
        rotaDeAdicao: `${entidadeMãe}.cronogramaDaMeta.novo`,
        'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronograma.novo`,
        'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronograma`,
        'rotaDeAdicao.fase': `${entidadeMãe}.faseCronograma.novo`,
        'rotaDeEdicao.fase': `${entidadeMãe}.faseCronograma.editar`,
        'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronograma.novo`,
        'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronograma.editar`,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
    },

    {
      path: ':meta_id/orcamento',
      name: `${entidadeMãe}.orcamentoDeMetas`,
      redirect: (to: RouteLocation) => `${to.path}/custo`,
      component: MetaOrçamentoRaiz,
      meta: {
        rotaPrescindeDeChave: true,
        rotasParaMenuSecundário: () => rotasParaMenuSecundário(
          'meta',
          usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
        ),
      },
      children: [
        {
          path: 'custo',
          name: `${entidadeMãe}.MetaOrcamentoCusto`,
          component: MetaOrcamento,
          props: { area: 'Custo', title: 'Previsão de Custo' },
          meta: {
            tituloMigalhaDeMeta: 'Previsão de custo',
            títuloParaMenu: 'Previsão de custo',
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          path: 'custo/:ano',
          name: `${entidadeMãe}.MetaOrcamentoCustoPorAno`,
          component: AddEditCusteio,
          meta: {
            rotaDeEscape: `${entidadeMãe}.MetaOrcamentoCusto`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
            tituloMigalhaDeMeta: 'Nova previsão de custo',
            migalhasDeMetas: [
              `${entidadeMãe}.MetaOrcamentoCusto`,
            ],
          },
        },
        {
          path: 'custo/:ano/:id',
          name: `${entidadeMãe}.MetaOrcamentoCustoPorAnoPorId`,
          component: AddEditCusteio,
          meta: {
            rotaDeEscape: `${entidadeMãe}.MetaOrcamentoCusto`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
            tituloMigalhaDeMeta: () => {
              const { emFoco } = useOrcamentosStore();
              if (!emFoco.parte_dotacao) {
                return 'previsão de custo';
              }

              return `Previsão de custo ${emFoco.parte_dotacao}`;
            },
            migalhasDeMetas: [
              `${entidadeMãe}.MetaOrcamentoCusto`,
            ],
          },
        },
        {
          path: 'planejado',
          name: `${entidadeMãe}.MetaOrcamentoPlanejado`,
          component: MetaOrcamento,
          props: { area: 'Planejado', title: 'Orçamento Planejado' },
          meta: {
            títuloParaMenu: 'Orçamento planejado',
            tituloMigalhaDeMeta: 'Orçamento planejado',
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          name: `${entidadeMãe}.MetaOrcamentoPlanejadoPorAno`,
          path: 'planejado/:ano',
          component: AddEditPlanejado,
          meta: {
            rotaDeEscape: `${entidadeMãe}.MetaOrcamentoPlanejado`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
            tituloMigalhaDeMeta: 'Nova dotação',
            migalhasDeMetas: [
              `${entidadeMãe}.MetaOrcamentoPlanejado`,
            ],
          },
        },
        {
          name: `${entidadeMãe}.MetaOrcamentoPlanejadoPorAnoPorId`,
          path: 'planejado/:ano/:id',
          component: AddEditPlanejado,
          meta: {
            rotaDeEscape: `${entidadeMãe}.MetaOrcamentoPlanejado`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
            tituloMigalhaDeMeta: () => {
              const { emFoco } = useOrcamentosStore();

              if (!emFoco.dotacao) {
                return 'Dotação';
              }

              return `Dotação ${emFoco.dotacao}`;
            },
            migalhasDeMetas: [
              `${entidadeMãe}.MetaOrcamentoPlanejado`,
            ],
          },
        },

        {
          path: 'realizado',
          name: `${entidadeMãe}.MetaOrcamentoRealizado`,
          component: MetaOrcamento,
          props: { area: 'Realizado', title: 'Execução orçamentária' },
          meta: {
            tituloMigalhaDeMeta: 'Execução orçamentária',
            títuloParaMenu: 'Execução orçamentária',
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          path: 'realizado/:ano/dotacao',
          name: `${entidadeMãe}.MetaOrcamentoRealizadoPorAnoDotacao`,
          component: AddRealizado,
          meta: {
            rotaDeEscape: `${entidadeMãe}.MetaOrcamentoRealizado`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
            tituloMigalhaDeMeta: 'Nova dotação',
            migalhasDeMetas: [
              `${entidadeMãe}.MetaOrcamentoRealizado`,
            ],
          },
        },
        {
          path: 'realizado/:ano/processo',
          name: `${entidadeMãe}.MetaOrcamentoRealizadoPorAnoProcesso`,
          component: AddRealizadoProcesso,
          meta: {
            rotaDeEscape: `${entidadeMãe}.MetaOrcamentoRealizado`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
            tituloMigalhaDeMeta: 'Novo processo',
            migalhasDeMetas: [
              `${entidadeMãe}.MetaOrcamentoRealizado`,
            ],
          },
        },
        {
          path: 'realizado/:ano/nota',
          name: `${entidadeMãe}.MetaOrcamentoRealizadoPorAnoNota`,
          component: AddRealizadoNota,
          meta: {
            rotaDeEscape: `${entidadeMãe}.MetaOrcamentoRealizado`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
            tituloMigalhaDeMeta: 'Nova nota de empenho',
            migalhasDeMetas: [
              `${entidadeMãe}.MetaOrcamentoRealizado`,
            ],
          },
        },
        {
          path: 'realizado/:ano/:id',
          name: `${entidadeMãe}.MetaOrcamentoRealizadoPorAnoPorId`,
          component: EditRealizado,
          meta: {
            rotaDeEscape: `${entidadeMãe}.MetaOrcamentoRealizado`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
            tituloMigalhaDeMeta: () => {
              const { emFoco } = useOrcamentosStore();

              if (!emFoco) {
                return 'Empenho/Liquidação';
              }

              if (emFoco.processo) return 'Processo';
              if (emFoco.nota_empenho) return 'Empenho';

              return 'Dotação';
            },
            migalhasDeMetas: [
              `${entidadeMãe}.MetaOrcamentoRealizado`,
            ],
          },
        },
        {
          path: 'realizado/:ano/dotacao/:id',
          name: `${entidadeMãe}.MetaOrcamentoRealizadoPorAnoDotacaoPorId`,
          component: EditRealizado,
          meta: {
            rotaDeEscape: `${entidadeMãe}.MetaOrcamentoRealizado`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
            tituloMigalhaDeMeta: () => {
              const { emFoco } = useOrcamentosStore();

              if (!emFoco) {
                return 'Empenho/Liquidação';
              }

              if (emFoco.processo) return 'Processo';
              if (emFoco.nota_empenho) return 'Empenho';

              return 'Dotação';
            },
            migalhasDeMetas: [
              `${entidadeMãe}.MetaOrcamentoRealizado`,
            ],
          },
        },
      ],
    },

    {
      path: ':meta_id/iniciativas',
      name: `${entidadeMãe}.metaIniciativas`,
      children: [
        {
          path: '',
          component: SingleMeta,
          name: `${entidadeMãe}.listaDeIniciativas`,
          meta: {
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          path: 'novo',
          name: `${entidadeMãe}.novaIniciativa`,
          component: AddEditIniciativa,
          meta: {
            rotaDeEscape: `${entidadeMãe}.listaDeIniciativas`,
            rotasParaMenuSecundário: () => rotasParaMenuSecundário(
              'meta',
              usePlanosSetoriaisStore(entidadeMãe).orcamentosDisponiveisNoPlanoEmFoco,
            ),
          },
        },
        {
          path: 'editar/:iniciativa_id',
          name: `${entidadeMãe}.editarIniciativa`,
          component: AddEditIniciativa,
          meta: {
            rotaDeEscape: `${entidadeMãe}.resumoDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id',
          name: `${entidadeMãe}.resumoDeIniciativa`,
          component: SingleIniciativa,
          meta: {
            títuloParaMenu: 'Resumo',
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/anexos',
          name: `${entidadeMãe}.anexosDaIniciativa`,
          component: () => import('@/views/metas/AnexosDasVariaveis.vue'),
          props: tiparPropsDeRota,
          meta: {
            títuloParaMenu: 'Anexos',
            título: 'Anexos das variáveis da iniciativa',
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/indicadores/novo',
          name: `${entidadeMãe}.indicadorDaIniciativa.novo`,
          component: AddEditIndicador,
          meta: {
            rotaDeEscape: `${entidadeMãe}.resumoDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id',
          name: `${entidadeMãe}.indicadorDaIniciativa`,
          component: AddEditIndicador,
          meta: {
            rotaDeEscape: `${entidadeMãe}.resumoDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis/novo',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavel.novo`,
          component: AddEditIndicador,
          props: { group: 'variaveis' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis/novo/:copy_id',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavel.copiar`,
          component: AddEditIndicador,
          props: { group: 'variaveis' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },

        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis/gerar',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavel.gerar`,
          component: AddEditIndicador,
          props: { group: 'variaveis' },
          meta: {
            funçãoDaTela: 'gerar',
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },

        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavel`,
          component: AddEditIndicador,
          props: { group: 'variaveis' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id/valores',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavel.valores`,
          component: AddEditIndicador,
          props: { group: 'valores' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis/:var_id/retroativos',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavel.retroativos`,
          component: AddEditIndicador,
          props: { group: 'retroativos' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },

        // /////////////////////////////////////////////////////////////////////////
        // Variáveis compostas
        // /////////////////////////////////////////////////////////////////////////
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/novo',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavelComposta.novo`,
          component: AddEditIndicador,
          props: { group: 'criar-ou-editar-variaveis-compostas' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            título: 'Nova variável composta',
            rotaPrescindeDeChave: true,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/gerar',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavelComposta.gerar`,
          component: AddEditIndicador,
          props: { group: 'gerar-compostas' },
          meta: {
            funçãoDaTela: 'gerar',
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            título: 'Auxiliar de variável composta',
            rotaPrescindeDeChave: true,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/:var_id',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavelComposta`,
          component: AddEditIndicador,
          props: { group: 'criar-ou-editar-variaveis-compostas' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            título: 'Editar variável composta',
            rotaPrescindeDeChave: true,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },

        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/:var_id/valores',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavelComposta.valores`,
          component: AddEditIndicador,
          props: { group: 'compostas-valores' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            título: 'Editar valores previstos',
            tipoDeValor: 'previsto',
            rotaPrescindeDeChave: true,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/indicadores/:indicador_id/variaveis-compostas/:var_id/retroativos',
          name: `${entidadeMãe}.indicadorDaIniciativa.variavelComposta.retroativos`,
          component: AddEditIndicador,
          props: { group: 'compostas-retroativos' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.indicadorDaIniciativa`,
            título: 'Editar valores realizados',
            tipoDeValor: 'realizado',
            rotaPrescindeDeChave: true,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },

        // /////////////////////////////////////////////////////////////////////////

        {
          path: ':iniciativa_id/evolucao',
          name: `${entidadeMãe}.evoluçãoDaIniciativa`,
          component: SingleEvolucao,
          meta: {
            títuloParaMenu: 'Evolução',
            rotaPrescindeDeChave: true,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
          children: [
            {
              path: ':indicador_id',
              name: `${entidadeMãe}.evoluçãoDoIndicadorDaIniciativa`,
              meta: {
                rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
              },
            },
            {
              path: ':indicador_id/variaveis/novo',
              name: `${entidadeMãe}.evoluçãoDaIniciativa.variavel.novo`,
              meta: {
                group: 'variaveis',
                rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
              },
            },
            {
              path: ':indicador_id/variaveis/novo/:copy_id',
              name: `${entidadeMãe}.evoluçãoDaIniciativa.variavel.copiar`,
              meta: {
                group: 'variaveis',
                rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
              },
            },
            {
              path: ':indicador_id/variaveis/:var_id',
              name: `${entidadeMãe}.evoluçãoDaIniciativa.variavel`,
              meta: {
                group: 'variaveis',
                rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
              },
            },
            {
              path: ':indicador_id/variaveis/:var_id/valores',
              name: `${entidadeMãe}.evoluçãoDaIniciativa.variavel.valores`,
              meta: {
                group: 'valores',
                rotaDeEscape: `${entidadeMãe}.evoluçãoDoIndicadorDaIniciativa`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
              },
            },
            {
              path: ':indicador_id/variaveis/:var_id/retroativos',
              name: `${entidadeMãe}.evoluçãoDaIniciativa.variavel.retroativos`,
              meta: {
                group: 'retroativos',
                rotaDeEscape: `${entidadeMãe}.evoluçãoDoIndicadorDaIniciativa`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
              },
            },
          ],
        },
        {
          path: ':iniciativa_id/cronograma',
          name: `${entidadeMãe}.cronogramaDaIniciativa`,
          component: SingleCronograma,
          meta: {
            títuloParaMenu: 'Cronograma',
            rotaDeAdicao: `${entidadeMãe}.cronogramaDaIniciativa.novo`,
            'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa`,
            'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa`,
            'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/cronograma/novo',
          name: `${entidadeMãe}.cronogramaDaIniciativa.novo`,
          component: AddEditCronograma,
          meta: {
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
            rotaDeEscape: `${entidadeMãe}.cronogramaDaIniciativa`,
          },
        },
        {
          path: ':iniciativa_id/cronograma/:cronograma_id',
          name: `${entidadeMãe}.cronogramaDaIniciativa.editar`,
          component: AddEditCronograma,
          meta: {
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
            rotaDeEscape: `${entidadeMãe}.cronogramaDaIniciativa`,
          },
        },
        {
          path: ':iniciativa_id/cronograma/:cronograma_id/etapas/novo',
          name: `${entidadeMãe}.etapaCronogramaDeIniciativa.novo`,
          component: SingleCronograma,
          props: { group: 'etapas' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.cronogramaDaIniciativa`,
            rotaDeAdicao: `${entidadeMãe}.cronogramaDaIniciativa.novo`,
            'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa`,
            'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa`,
            'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id',
          name: `${entidadeMãe}.etapaCronogramaDeIniciativa`,
          component: SingleCronograma,
          props: { group: 'etapas' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.cronogramaDaIniciativa`,
            rotaDeAdicao: `${entidadeMãe}.cronogramaDaIniciativa.novo`,
            'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa`,
            'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa`,
            'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/novo',
          name: `${entidadeMãe}.faseCronogramaDeIniciativa.novo`,
          component: SingleCronograma,
          props: { group: 'fase' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.cronogramaDaIniciativa`,
            rotaDeAdicao: `${entidadeMãe}.cronogramaDaIniciativa.novo`,
            'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa`,
            'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa`,
            'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id',
          name: `${entidadeMãe}.faseCronogramaDeIniciativa`,
          component: SingleCronograma,
          props: { group: 'fase' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.cronogramaDaIniciativa`,
            rotaDeAdicao: `${entidadeMãe}.cronogramaDaIniciativa.novo`,
            'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa`,
            'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa`,
            'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo',
          name: `${entidadeMãe}.subfaseCronogramaDeIniciativa.novo`,
          component: SingleCronograma,
          props: { group: 'subfase' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.cronogramaDaIniciativa`,
            rotaDeAdicao: `${entidadeMãe}.cronogramaDaIniciativa.novo`,
            'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa`,
            'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa`,
            'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id',
          name: `${entidadeMãe}.subfaseCronogramaDeIniciativa`,
          component: SingleCronograma,
          props: { group: 'subfase' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.cronogramaDaIniciativa`,
            rotaDeAdicao: `${entidadeMãe}.cronogramaDaIniciativa.novo`,
            'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa`,
            'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa`,
            'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/cronograma/:cronograma_id/monitorar/atividade',
          name: `${entidadeMãe}.cronogramaDaIniciativa.monitorar.atividade`,
          component: SingleCronograma,
          props: { group: 'monitorar', recorte: 'atividade' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.cronogramaDaIniciativa`,
            rotaDeAdicao: `${entidadeMãe}.cronogramaDaIniciativa.novo`,
            'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa`,
            'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa`,
            'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/cronograma/:cronograma_id/monitorar/:etapa_id',
          name: `${entidadeMãe}.cronogramaDaIniciativa.monitorar.etapa`,
          component: SingleCronograma,
          props: { group: 'monitorar' },
          meta: {
            rotaDeEscape: `${entidadeMãe}.cronogramaDaIniciativa`,
            rotaDeAdicao: `${entidadeMãe}.cronogramaDaIniciativa.novo`,
            'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeIniciativa`,
            'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeIniciativa`,
            'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa.novo`,
            'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeIniciativa`,
            rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
          },
        },
        {
          path: ':iniciativa_id/atividades',
          name: `${entidadeMãe}.iniciativaAtividades`,
          children: [
            {
              path: '',
              name: `${entidadeMãe}.listaDeAtividades`,
              component: SingleIniciativa,
              meta: {
                rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
              },
            },
            {
              path: 'novo',
              name: `${entidadeMãe}.novaAtividade`,
              component: AddEditAtividade,
              meta: {
                rotasParaMenuSecundário: rotasParaMenuSecundário('iniciativa'),
                rotaDeEscape: `${entidadeMãe}.resumoDeAtividade`,
              },
            },
            {
              path: 'editar/:atividade_id',
              name: `${entidadeMãe}.editarAtividade`,
              component: AddEditAtividade,
              meta: {
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
                rotaDeEscape: `${entidadeMãe}.resumoDeAtividade`,
              },
            },
            {
              path: ':atividade_id',
              name: `${entidadeMãe}.resumoDeAtividade`,
              component: SingleAtividade,
              meta: {
                títuloParaMenu: 'Resumo',
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/anexos',
              name: `${entidadeMãe}.anexosDaAtividade`,
              component: () => import('@/views/metas/AnexosDasVariaveis.vue'),
              props: tiparPropsDeRota,
              meta: {
                títuloParaMenu: 'Anexos',
                título: 'Anexos das variáveis da atividade',
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/indicadores/novo',
              name: `${entidadeMãe}.indicadorDaAtividade.novo`,
              component: AddEditIndicador,
              meta: {
                rotaDeEscape: `${entidadeMãe}.resumoDeAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/indicadores/:indicador_id',
              component: AddEditIndicador,
              meta: {
                rotaDeEscape: `${entidadeMãe}.resumoDeAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
              name: `${entidadeMãe}.indicadorDaAtividade`,
            },
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis/novo',
              name: `${entidadeMãe}.indicadorDaAtividade.variavel.novo`,
              component: AddEditIndicador,
              props: { group: 'variaveis' },
              meta: {
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },

            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis/gerar',
              name: `${entidadeMãe}.indicadorDaAtividade.variavel.gerar`,
              component: AddEditIndicador,
              props: { group: 'variaveis' },
              meta: {
                funçãoDaTela: 'gerar',
                rotaDeEscape: `${entidadeMãe}.indicadorDaAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },

            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis/novo/:copy_id',
              name: `${entidadeMãe}.indicadorDaAtividade.variavel.copiar`,
              component: AddEditIndicador,
              props: { group: 'variaveis' },
              meta: {
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id',
              name: `${entidadeMãe}.indicadorDaAtividade.variavel`,
              component: AddEditIndicador,
              props: { group: 'variaveis' },
              meta: {
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id/valores',
              name: `${entidadeMãe}.indicadorDaAtividade.variavel.valores`,
              component: AddEditIndicador,
              props: { group: 'valores' },
              meta: {
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis/:var_id/retroativos',
              name: `${entidadeMãe}.indicadorDaAtividade.variavel.retroativos`,
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
              name: `${entidadeMãe}.indicadorDaAtividade.variavelComposta.novo`,
              component: AddEditIndicador,
              props: { group: 'criar-ou-editar-variaveis-compostas' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.indicadorDaAtividade`,
                título: 'Nova variável composta',
                rotaPrescindeDeChave: true,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/gerar',
              name: `${entidadeMãe}.indicadorDaAtividade.variavelComposta.gerar`,
              component: AddEditIndicador,
              props: { group: 'gerar-compostas' },
              meta: {
                funçãoDaTela: 'gerar',
                rotaDeEscape: `${entidadeMãe}.indicadorDaAtividade`,
                título: 'Auxiliar de variável composta',
                rotaPrescindeDeChave: true,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/:var_id',
              name: `${entidadeMãe}.indicadorDaAtividade.variavelComposta`,
              component: AddEditIndicador,
              props: { group: 'criar-ou-editar-variaveis-compostas' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.indicadorDaAtividade`,
                título: 'Editar variável composta',
                rotaPrescindeDeChave: true,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },

            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/:var_id/valores',
              name: `${entidadeMãe}.indicadorDaAtividade.variavelComposta.valores`,
              component: AddEditIndicador,
              props: { group: 'compostas-valores' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.indicadorDaAtividade`,
                título: 'Editar valores previstos',
                tipoDeValor: 'previsto',
                rotaPrescindeDeChave: true,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/indicadores/:indicador_id/variaveis-compostas/:var_id/retroativos',
              name: `${entidadeMãe}.indicadorDaAtividade.variavelComposta.retroativos`,
              component: AddEditIndicador,
              props: { group: 'compostas-retroativos' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.indicadorDaAtividade`,
                título: 'Editar valores realizados',
                tipoDeValor: 'realizado',
                rotaPrescindeDeChave: true,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },

            // /////////////////////////////////////////////////////////////////////////

            {
              path: ':atividade_id/evolucao',
              name: `${entidadeMãe}.evoluçãoDaAtividade`,
              component: SingleEvolucao,
              meta: {
                títuloParaMenu: 'Evolução',
                rotaPrescindeDeChave: true,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
              children: [
                {
                  path: ':indicador_id',
                  name: `${entidadeMãe}.evoluçãoDoIndicadorDaAtividade`,
                  meta: {
                    rotasParaMenuSecundário:
                      rotasParaMenuSecundário('atividade'),
                  },
                },
                {
                  path: ':indicador_id/variaveis/novo',
                  name: `${entidadeMãe}.evoluçãoDaAtividade.variavel.novo`,
                  meta: {
                    group: 'variaveis',
                    rotasParaMenuSecundário:
                      rotasParaMenuSecundário('atividade'),
                  },
                },
                {
                  path: ':indicador_id/variaveis/novo/:copy_id',
                  name: `${entidadeMãe}.evoluçãoDaAtividade.variavel.copiar`,
                  meta: {
                    group: 'variaveis',
                    rotasParaMenuSecundário:
                      rotasParaMenuSecundário('atividade'),
                  },
                },
                {
                  path: ':indicador_id/variaveis/:var_id',
                  name: `${entidadeMãe}.evoluçãoDaAtividade.variavel`,
                  meta: {
                    group: 'variaveis',
                    rotasParaMenuSecundário:
                      rotasParaMenuSecundário('atividade'),
                  },
                },
                {
                  path: ':indicador_id/variaveis/:var_id/valores',
                  name: `${entidadeMãe}.evoluçãoDaAtividade.variavel.valores`,
                  meta: {
                    group: 'valores',
                    rotaDeEscape: `${entidadeMãe}.evoluçãoDoIndicadorDaAtividade`,
                    rotasParaMenuSecundário:
                      rotasParaMenuSecundário('atividade'),
                  },
                },
                {
                  path: ':indicador_id/variaveis/:var_id/retroativos',
                  name: `${entidadeMãe}.evoluçãoDaAtividade.variavel.retroativos`,
                  meta: {
                    group: 'retroativos',
                    rotaDeEscape: `${entidadeMãe}.evoluçãoDoIndicadorDaAtividade`,
                    rotasParaMenuSecundário:
                      rotasParaMenuSecundário('atividade'),
                  },
                },
              ],
            },
            {
              path: ':atividade_id/cronograma',
              name: `${entidadeMãe}.cronogramaDaAtividade`,
              component: SingleCronograma,
              meta: {
                títuloParaMenu: 'Cronograma',
                rotaDeAdicao: `${entidadeMãe}.cronogramaDaAtividade.novo`,
                'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade.novo`,
                'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade`,
                'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade`,
                'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/cronograma/novo',
              name: `${entidadeMãe}.cronogramaDaAtividade.novo`,
              component: AddEditCronograma,
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/cronograma/:cronograma_id',
              name: `${entidadeMãe}.cronogramaDaAtividade.editar`,
              component: AddEditCronograma,
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/cronograma/:cronograma_id/etapas/novo',
              name: `${entidadeMãe}.etapaCronogramaDeAtividade.novo`,
              component: SingleCronograma,
              props: { group: 'etapas' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaAtividade`,
                rotaDeAdicao: `${entidadeMãe}.cronogramaDaAtividade.novo`,
                'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade.novo`,
                'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade`,
                'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade`,
                'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id',
              name: `${entidadeMãe}.etapaCronogramaDeAtividade`,
              component: SingleCronograma,
              props: { group: 'etapas' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaAtividade`,
                rotaDeAdicao: `${entidadeMãe}.cronogramaDaAtividade.novo`,
                'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade.novo`,
                'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade`,
                'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade`,
                'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/novo',
              name: `${entidadeMãe}.faseCronogramaDeAtividade.novo`,
              component: SingleCronograma,
              props: { group: 'fase' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaAtividade`,
                rotaDeAdicao: `${entidadeMãe}.cronogramaDaAtividade.novo`,
                'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade.novo`,
                'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade`,
                'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade`,
                'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id',
              name: `${entidadeMãe}.faseCronogramaDeAtividade`,
              component: SingleCronograma,
              props: { group: 'fase' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaAtividade`,
                rotaDeAdicao: `${entidadeMãe}.cronogramaDaAtividade.novo`,
                'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade.novo`,
                'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade`,
                'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade`,
                'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/novo',
              name: `${entidadeMãe}.subfaseCronogramaDeAtividade.novo`,
              component: SingleCronograma,
              props: { group: 'subfase' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaAtividade`,
                rotaDeAdicao: `${entidadeMãe}.cronogramaDaAtividade.novo`,
                'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade.novo`,
                'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade`,
                'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade`,
                'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
            {
              path: ':atividade_id/cronograma/:cronograma_id/etapas/:etapa_id/:fase_id/:subfase_id',
              name: `${entidadeMãe}.subfaseCronogramaDeAtividade`,
              component: SingleCronograma,
              props: { group: 'subfase' },
              meta: {
                rotaDeEscape: `${entidadeMãe}.cronogramaDaAtividade`,
                rotaDeAdicao: `${entidadeMãe}.cronogramaDaAtividade.novo`,
                'rotaDeAdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade.novo`,
                'rotaDeEdicao.etapa': `${entidadeMãe}.etapaCronogramaDeAtividade`,
                'rotaDeAdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.fase': `${entidadeMãe}.faseCronogramaDeAtividade`,
                'rotaDeAdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade.novo`,
                'rotaDeEdicao.subfase': `${entidadeMãe}.subfaseCronogramaDeAtividade`,
                rotasParaMenuSecundário: rotasParaMenuSecundário('atividade'),
              },
            },
          ],
        },
      ],
    },
  ];
};

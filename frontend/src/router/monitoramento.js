import dateToTitle from '@/helpers/dateToTitle';
import {
  ListCiclos,
  ListCiclosPassados,
  ListMonitoramentoMetasCronograma,
  MonitoramentoMetas,
  MonitoramentoMetasCronograma,
} from '@/views/monitoramento';
import MonitoramentosTarefas from '@/views/monitoramento/MonitoramentoPorTarefas.vue';
import MonitoramentosVariáveis from '@/views/monitoramento/MonitoramentoPorVariaveis.vue';
import MonitoramentosRaiz from '@/views/monitoramento/MonitoramentosRaiz.vue';
// Stores
// eslint-disable-next-line import/no-cycle
import { useCiclosStore } from '@/stores/ciclos.store';
// eslint-disable-next-line import/no-cycle
import { usePdMStore } from '@/stores/pdm.store';

// Apesar dessa função para normalizar o comportamento, há exceções
const rotasParaMigalhasDePão = (
  seção,
  metaPresente = false,
  iniciativaPresente = false,
  atividadePresente = false,
  cicloPresente = false,
) => {
  const rotas = [
    'MonitoramentoDeCicloVigente',
  ];

  switch (seção) {
    case 'evolucao':
      if (metaPresente) {
        rotas.push('monitoramentoDeEvoluçãoDeMetaEspecífica');
      }
      break;
    case 'cronograma':
      if (metaPresente) {
        rotas.push('monitoramentoDeCronogramaDeMetaEspecífica');
      }
      if (iniciativaPresente) {
        rotas.push('monitoramentoDeCronogramaDeIniciativaEspecífica');
      }
      if (atividadePresente) {
        rotas.push('monitoramentoDeCronogramaDeAtividadeEspecífica');
      }
      break;
    case 'ciclos':
      rotas.push('monitoramentoDeCiclosDeMetas');
      if (cicloPresente) {
        rotas.push('monitoramentoDeCronogramaDeCicloEspecífico');
      }
      break;
    case 'metas':
      if (metaPresente) {
        rotas.push('monitoramentoDeMetas');
      }
      break;
    default:
      break;
  }

  return rotas;
};

export default {
  path: '/monitoramento',
  meta: {
    rotaPrescindeDeChave: false,

    limitarÀsPermissões: [
      'PDM.admin_cp',
      'PDM.tecnico_cp',
      'PDM.ponto_focal',
    ],
    título: 'Monitoramento',
    entidadeMãe: 'pdm',
    íconeParaMenu: `<svg width="20" height="22" viewBox="0 0 20 22" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
<path fill-rule="evenodd" clip-rule="evenodd" d="M6 0C6.55229 0 7 0.447715 7 1V2H13V1C13 0.447715 13.4477 0 14 0C14.5523 0 15 0.447715 15 1V2.00163C15.4755 2.00489 15.891 2.01471 16.2518 2.04419C16.8139 2.09012 17.3306 2.18868 17.816 2.43597C18.5686 2.81947 19.1805 3.43139 19.564 4.18404C19.8113 4.66937 19.9099 5.18608 19.9558 5.74817C20 6.28936 20 6.95372 20 7.75868V11.5C20 12.0523 19.5523 12.5 19 12.5C18.4477 12.5 18 12.0523 18 11.5V10H2V16.2C2 17.0566 2.00078 17.6389 2.03755 18.089C2.07337 18.5274 2.1383 18.7516 2.21799 18.908C2.40973 19.2843 2.7157 19.5903 3.09202 19.782C3.24842 19.8617 3.47262 19.9266 3.91104 19.9624C4.36113 19.9992 4.94342 20 5.8 20H10C10.5523 20 11 20.4477 11 21C11 21.5523 10.5523 22 10 22H5.75868C4.95372 22 4.28936 22 3.74817 21.9558C3.18608 21.9099 2.66937 21.8113 2.18404 21.564C1.43139 21.1805 0.819468 20.5686 0.435975 19.816C0.188684 19.3306 0.0901197 18.8139 0.0441945 18.2518C-2.28137e-05 17.7106 -1.23241e-05 17.0463 4.31292e-07 16.2413V7.7587C-1.23241e-05 6.95373 -2.28137e-05 6.28937 0.0441945 5.74817C0.0901197 5.18608 0.188684 4.66937 0.435975 4.18404C0.819468 3.43139 1.43139 2.81947 2.18404 2.43597C2.66937 2.18868 3.18608 2.09012 3.74818 2.04419C4.10898 2.01471 4.52454 2.00489 5 2.00163V1C5 0.447715 5.44772 0 6 0ZM5 4.00176C4.55447 4.00489 4.20463 4.01356 3.91104 4.03755C3.47262 4.07337 3.24842 4.1383 3.09202 4.21799C2.7157 4.40973 2.40973 4.71569 2.21799 5.09202C2.1383 5.24842 2.07337 5.47262 2.03755 5.91104C2.00078 6.36113 2 6.94342 2 7.8V8H18V7.8C18 6.94342 17.9992 6.36113 17.9624 5.91104C17.9266 5.47262 17.8617 5.24842 17.782 5.09202C17.5903 4.71569 17.2843 4.40973 16.908 4.21799C16.7516 4.1383 16.5274 4.07337 16.089 4.03755C15.7954 4.01356 15.4455 4.00489 15 4.00176V5C15 5.55228 14.5523 6 14 6C13.4477 6 13 5.55228 13 5V4H7V5C7 5.55228 6.55229 6 6 6C5.44772 6 5 5.55228 5 5V4.00176ZM19.7071 14.7929C20.0976 15.1834 20.0976 15.8166 19.7071 16.2071L15.2071 20.7071C14.8166 21.0976 14.1834 21.0976 13.7929 20.7071L11.7929 18.7071C11.4024 18.3166 11.4024 17.6834 11.7929 17.2929C12.1834 16.9024 12.8166 16.9024 13.2071 17.2929L14.5 18.5858L18.2929 14.7929C18.6834 14.4024 19.3166 14.4024 19.7071 14.7929Z" />
</svg>`,

    rotasParaMenuPrincipal: [
      'MonitoramentoDeCicloVigente',
      'monitoramentoDeCiclosDeMetas',
      'monitoramentoDeCiclosFechadosDeMetas',
    ],
  },
  children: [
    {
      path: '',
      component: MonitoramentosRaiz,
      name: 'MonitoramentoDeCicloVigente',
      meta: {
        título: 'Monitoramento',
        títuloParaMenu: 'Ciclo Vigente',
        rotasParaMigalhasDePão: rotasParaMigalhasDePão(),
      },

      redirect: () => ({ name: 'monitoramentoPorVariáveis' }),

      children: [
        {
          path: 'variaveis',
          name: 'monitoramentoPorVariáveis',
          component: MonitoramentosVariáveis,
          meta: {
            rotaPrescindeDeChave: true,
          },
        },
        {
          path: 'tarefas',
          name: 'monitoramentoPorTarefas',
          component: MonitoramentosTarefas,
          meta: {
            rotaPrescindeDeChave: true,
          },
        },
      ],
    },
    {
      name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
      path: 'evolucao/:meta_id',
      component: MonitoramentoMetas,
      meta: {
        título: () => {
          const código = useCiclosStore()?.SingleMeta?.meta?.codigo;
          const título = useCiclosStore()?.SingleMeta?.meta?.titulo;

          return código && título
            ? `Meta ${código} ${título}`
            : 'Meta';
        },
        títuloParaMenu: null,
        rotasParaMigalhasDePão: rotasParaMigalhasDePão('evolucao', true),
      },
    },
    {
      // talvez essa rota não precise mais existir
      path: 'cronograma',
      name: 'monitoramentoDeCronogramaDeMetas',
      component: ListMonitoramentoMetasCronograma,
      meta: {
        título: () => {
          const dataCiclo = usePdMStore()?.activePdm?.ciclo_fisico_ativo?.data_ciclo;
          return dataCiclo ? dateToTitle(dataCiclo) : 'Coleta - Cronograma';
        },
        títuloParaMenu: null,
        rotasParaMigalhasDePão: rotasParaMigalhasDePão('cronograma'),
      },
    },
    {
      path: 'cronograma/:meta_id',
      name: 'monitoramentoDeCronogramaDeMetaEspecífica',
      component: MonitoramentoMetasCronograma,
      meta: {
        título: () => {
          const código = useCiclosStore()?.SingleMeta?.meta?.codigo;
          const título = useCiclosStore()?.SingleMeta?.meta?.titulo;

          return código && título
            ? `Meta ${código} ${título}`
            : 'Meta';
        },
        títuloParaMenu: null,
        rotasParaMigalhasDePão: rotasParaMigalhasDePão('cronograma', true),
      },
    },
    {
      path: 'cronograma/:meta_id/editar/:cron_id/:etapa_id',
      component: MonitoramentoMetasCronograma,
      meta: {
        rotasParaMigalhasDePão: rotasParaMigalhasDePão('cronograma', true),
        rotaDeEscape: 'monitoramentoDeCronogramaDeMetaEspecífica',
      },
    },
    {
      path: 'cronograma/:meta_id/:iniciativa_id',
      component: MonitoramentoMetasCronograma,
      name: 'monitoramentoDeCronogramaDeIniciativaEspecífica',
      meta: {
        título: () => {
          const rótulo = usePdMStore()?.activePdm?.rotulo_iniciativa || 'Iniciativa';
          const iniciativa = useCiclosStore()?.iniciativaEmFoco?.iniciativa;

          return iniciativa?.codigo && iniciativa?.titulo
            ? `${rótulo}: ${iniciativa.codigo} • ${iniciativa.titulo}`
            : rótulo;
        },
        títuloParaMenu: null,
        rotasParaMigalhasDePão: rotasParaMigalhasDePão('cronograma', true, true),
      },
    },
    {
      path: 'cronograma/:meta_id/:iniciativa_id/editar/:cron_id/:etapa_id',
      component: MonitoramentoMetasCronograma,
      meta: {
        título: () => {
          const rótulo = usePdMStore()?.activePdm?.rotulo_iniciativa || 'Iniciativa';
          const iniciativa = useCiclosStore()?.iniciativaEmFoco?.iniciativa;

          return iniciativa?.codigo && iniciativa?.titulo
            ? `${rótulo}: ${iniciativa.codigo} • ${iniciativa.titulo}`
            : rótulo;
        },
        títuloParaMenu: null,
        rotasParaMigalhasDePão: rotasParaMigalhasDePão('cronograma', true, true),
      },
    },
    {
      path: 'cronograma/:meta_id/:iniciativa_id/:atividade_id',
      component: MonitoramentoMetasCronograma,
      name: 'monitoramentoDeCronogramaDeAtividadeEspecífica',
      meta: {
        título: () => {
          const rótulo = usePdMStore()?.activePdm?.rotulo_atividade || 'Atividade';
          const atividade = useCiclosStore()?.atividadeEmFoco?.atividade;

          return atividade?.codigo && atividade?.titulo
            ? `${rótulo}: ${atividade?.codigo} • ${atividade?.titulo}`
            : rótulo;
        },
        títuloParaMenu: null,
        rotasParaMigalhasDePão: rotasParaMigalhasDePão('cronograma', true, true, true),
      },
    },
    {
      path: 'cronograma/:meta_id/:iniciativa_id/:atividade_id/editar/:cron_id/:etapa_id',
      component: MonitoramentoMetasCronograma,
      meta: {
        título: () => {
          const rótulo = usePdMStore()?.activePdm?.rotulo_atividade || 'Atividade';
          const atividade = useCiclosStore()?.atividadeEmFoco?.atividade;

          return atividade?.codigo && atividade?.titulo
            ? `${rótulo}: ${atividade?.codigo} • ${atividade?.titulo}`
            : rótulo;
        },
        títuloParaMenu: null,
        rotasParaMigalhasDePão: rotasParaMigalhasDePão('cronograma', true, true, true),
      },
    },
    {
      path: 'ciclos',
      name: 'monitoramentoDeCiclosDeMetas',
      component: ListCiclos,
      meta: {
        rotasParaMigalhasDePão: rotasParaMigalhasDePão(),
        título: 'Próximos ciclos',
        títuloParaMenu: null,
        limitarÀsPermissões: [
          'CadastroCicloFisico',
          'PDM.admin_cp',
          'CadastroMeta.administrador_no_pdm',
          'PDM.tecnico_cp',
        ],
      },
    },
    {
      path: 'ciclos/fechados',
      name: 'monitoramentoDeCiclosFechadosDeMetas',
      component: ListCiclosPassados,
      meta: {
        rotasParaMigalhasDePão: rotasParaMigalhasDePão(),
        título: 'Ciclos fechados',
        títuloParaMenu: null,
        limitarÀsPermissões: [
          'CadastroCicloFisico',
          'PDM.admin_cp',
          'CadastroMeta.administrador_no_pdm',
          'PDM.tecnico_cp',
        ],
      },
    },
    {
      path: 'ciclos/:ciclo_id',
      component: ListCiclos,
      name: 'monitoramentoDeCronogramaDeCicloEspecífico',
      meta: {
        rotasParaMigalhasDePão: rotasParaMigalhasDePão('ciclos', false, false, false, true),
        títuloParaMenu: null,
      },
    },
    {
      path: 'metas/:meta_id',
      name: 'monitoramentoDeMetas',
      component: MonitoramentoMetas,
      meta: {
        título: () => {
          const dataCiclo = usePdMStore()?.activePdm?.ciclo_fisico_ativo?.data_ciclo;
          return dataCiclo ? dateToTitle(dataCiclo) : 'Monitoramento de meta';
        },
        títuloParaMenu: null,
        rotasParaMigalhasDePão: rotasParaMigalhasDePão('metas', true),
      },
    },
  ],
};

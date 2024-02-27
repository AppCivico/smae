import {
  ListCiclos,
  ListCiclosPassados,
  ListMonitoramentoMetas,
  ListMonitoramentoMetasCronograma,
  ListMonitoramentoMetasEvolucao,
  MonitoramentoMetas,
  MonitoramentoMetasCronograma,
} from '@/views/monitoramento';
import MonitoramentosRaiz from '@/views/monitoramento/MonitoramentosRaiz.vue';
import MonitoramentosVariáveis from '@/views/monitoramento/MonitoramentoPorVariaveis.vue';
import MonitoramentosTarefas from '@/views/monitoramento/MonitoramentoPorTarefas.vue';

// Stores
import { useAuthStore } from '@/stores/auth.store';

const rotasParaMenuSecundário = [
  {
    títuloParaGrupoDeLinksNoMenu: 'Monitoramento',
    rotas: [
      'MonitoramentoDeCicloVigente',
    ],
  },
  {
    títuloParaGrupoDeLinksNoMenu: 'Ciclo vigente',
    rotas: [
      'monitoramentoDeFasesDeMetas',
      'monitoramentoDeEvoluçãoDeMetas',
      'monitoramentoDeCronogramaDeMetas',
    ],
  },
  {
    títuloParaGrupoDeLinksNoMenu: 'Configuração',
    rotas: [
      'monitoramentoDeCiclosDeMetas',
      'monitoramentoDeCiclosFechadosDeMetas',
    ],
  },
];

export default {
  path: '/monitoramento',
  meta: {
    rotaPrescindeDeChave: false,
  },
  children: [
    {
      path: '',
      component: MonitoramentosRaiz,
      name: 'MonitoramentoDeCicloVigente',
      props: {
        parentPage: 'fases',
      },
      meta: {
        título: 'Ciclo vigente',
        rotasParaMenuSecundário,
      },

      redirect: () => (useAuthStore()?.user?.flags?.mf_v2
        ? { name: 'monitoramentoPorVariáveis' }
        : { name: 'monitoramentoDeEvoluçãoDeMetas' }),

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
      path: 'fases',
      name: 'monitoramentoDeFasesDeMetas',
      component: ListMonitoramentoMetas,
      props: {
        parentPage: 'fases',
      },
      meta: {
        título: 'Metas por fase do ciclo',
        rotasParaMenuSecundário,
      },
    },
    {
      name: 'monitoramentoDeEvoluçãoDeMetas',
      path: 'evolucao',
      component: ListMonitoramentoMetasEvolucao,
      props: {
        parentPage: 'evolucao',
      },
      meta: {
        título: 'Coleta - Evolução',
        rotasParaMenuSecundário,
      },
    },
    {
      name: 'monitoramentoDeEvoluçãoDeMetaEspecífica',
      path: 'evolucao/:meta_id',
      component: MonitoramentoMetas,
      props: {
        parentPage: 'evolucao',
      },
      meta: {
        rotasParaMenuSecundário,
      },
    },
    {
      path: 'cronograma',
      name: 'monitoramentoDeCronogramaDeMetas',
      component: ListMonitoramentoMetasCronograma,
      props: {
        parentPage: 'cronograma',
      },
      meta: {
        título: 'Coleta - Cronograma',
        rotasParaMenuSecundário,
      },
    },
    {
      path: 'cronograma/:meta_id',
      component: MonitoramentoMetasCronograma,
      props: {
        parentPage: 'cronograma',
      },
      meta: {
        rotasParaMenuSecundário,
      },
    },
    {
      path: 'cronograma/:meta_id/editar/:cron_id/:etapa_id',
      component: MonitoramentoMetasCronograma,
      props: {
        parentPage: 'cronograma',
      },
      meta: {
        rotasParaMenuSecundário,
      },
    },
    {
      path: 'cronograma/:meta_id/:iniciativa_id',
      component: MonitoramentoMetasCronograma,
      props: {
        parentPage: 'cronograma',
      },
      meta: {
        rotasParaMenuSecundário,
      },
    },
    {
      path: 'cronograma/:meta_id/:iniciativa_id/editar/:cron_id/:etapa_id',
      component: MonitoramentoMetasCronograma,
      props: {
        parentPage: 'cronograma',
      },
      meta: {
        rotasParaMenuSecundário,
      },
    },
    {
      path: 'cronograma/:meta_id/:iniciativa_id/:atividade_id',
      component: MonitoramentoMetasCronograma,
      props: {
        parentPage: 'cronograma',
      },
      meta: {
        rotasParaMenuSecundário,
      },
    },
    {
      path: 'cronograma/:meta_id/:iniciativa_id/:atividade_id/editar/:cron_id/:etapa_id',
      component: MonitoramentoMetasCronograma,
      props: {
        parentPage: 'cronograma',
      },
      meta: {
        rotasParaMenuSecundário,
      },
    },
    {
      path: 'ciclos',
      name: 'monitoramentoDeCiclosDeMetas',
      component: ListCiclos,
      props: {
        parentPage: 'ciclos',
      },
      meta: {
        rotasParaMenuSecundário,
        título: 'Próximos ciclos',
      },
    },
    {
      path: 'ciclos/fechados',
      name: 'monitoramentoDeCiclosFechadosDeMetas',
      component: ListCiclosPassados,
      props: {
        parentPage: 'ciclos',
      },
      meta: {
        rotasParaMenuSecundário,
        título: 'Ciclos fechados',
      },
    },
    {
      path: 'ciclos/:ciclo_id',
      component: ListCiclos,
      props: {
        parentPage: 'ciclos',
      },
      meta: {
        rotasParaMenuSecundário,
      },
    },
    {
      path: 'metas/:meta_id',
      component: MonitoramentoMetas,
      props: {
        parentPage: 'metas',
      },
      meta: {
        rotasParaMenuSecundário,
      },
    },
  ],
};

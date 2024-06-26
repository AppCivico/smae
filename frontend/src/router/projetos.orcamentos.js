import AddEditCusteio from '@/views/orcamento/AddEditCusteio.vue';
import AddEditPlanejado from '@/views/orcamento/AddEditPlanejado.vue';
import AddRealizado from '@/views/orcamento/AddRealizado.vue';
import AddRealizadoNota from '@/views/orcamento/AddRealizadoNota.vue';
import AddRealizadoProcesso from '@/views/orcamento/AddRealizadoProcesso.vue';
import EditRealizado from '@/views/orcamento/EditRealizado.vue';
import OrcamentosLista from '@/views/projetos.orcamentos/OrcamentosLista.vue';
import OrcamentosRaiz from '@/views/projetos.orcamentos/OrcamentosRaiz.vue';

export default {
  path: 'orcamentos',
  component: OrcamentosRaiz,
  name: 'OrcamentosRaiz',

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
  }),
  redirect: () => ({ name: 'ProjetoOrçamentoCusto' }),
  meta: {
    título: 'Orçamentos',
    limitarÀsPermissões: [
      'Projeto.orcamento',
    ],
    rotasParaMigalhasDePão: [
      'projetosListar',
      'projetosResumo',
      'OrcamentosRaiz',
    ],
    rotaPrescindeDeChave: false,
  },

  children: [
    {
      name: 'ProjetoOrçamentoCusto',
      path: 'custo',
      component: OrcamentosLista,
      meta: {
        títuloParaMenu: 'Previsão de custo',
        título: 'Previsão de custo',
        area: 'Custo',
        rotaParaAdição: 'ProjetoOrçamentoCustoPorAno',
        rotaParaEdição: 'ProjetoOrçamentoCustoPorAnoPorId',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
        ],
      },
    },
    {
      name: 'ProjetoOrçamentoCustoPorAno',
      path: 'custo/:ano',
      component: AddEditCusteio,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'ProjetoOrçamentoCusto',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'ProjetoOrçamentoCusto',
        ],
      },
    },
    {
      name: 'ProjetoOrçamentoCustoPorAnoPorId',
      component: AddEditCusteio,
      path: 'custo/:ano/:id',
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'ProjetoOrçamentoCusto',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'ProjetoOrçamentoCusto',
        ],
      },
    },

    {
      name: 'ProjetoOrçamentoPlanejado',
      path: 'planejado',
      component: OrcamentosLista,
      meta: {
        títuloParaMenu: 'Orçamento planejado',
        título: 'Orçamento planejado',
        area: 'Planejado',
        rotaParaAdição: 'ProjetoOrçamentoPlanejadoPorAno',
        rotaParaEdição: 'ProjetoOrçamentoPlanejadoPorAnoPorId',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
        ],
      },
    },
    {
      name: 'ProjetoOrçamentoPlanejadoPorAno',
      path: 'planejado/:ano',
      component: AddEditPlanejado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'ProjetoOrçamentoPlanejado',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'ProjetoOrçamentoPlanejado',
        ],
      },
    },
    {
      name: 'ProjetoOrçamentoPlanejadoPorAnoPorId',
      path: 'planejado/:ano/:id',
      component: AddEditPlanejado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'ProjetoOrçamentoPlanejado',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'ProjetoOrçamentoPlanejado',
        ],
      },
    },

    {
      name: 'ProjetoOrçamentoRealizado',
      path: 'realizado',
      component: OrcamentosLista,
      meta: {
        títuloParaMenu: 'Execução orçamentária',
        título: 'Execução orçamentária',
        area: 'Realizado',
        rotaParaEdição: 'ProjetoOrçamentoRealizadoPorAnoPorId',
        rotasParaAdição: [
          {
            texto: 'Dotação',
            nome: 'ProjetoOrçamentoRealizadoPorAnoPorDotação',
          },
          {
            texto: 'Processo',
            nome: 'ProjetoOrçamentoRealizadoPorAnoPorProcesso',
          },
          {
            texto: 'Nota de empenho',
            nome: 'ProjetoOrçamentoRealizadoPorAnoPorNota',
          },
        ],
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
        ],
      },
    },
    {
      name: 'ProjetoOrçamentoRealizadoPorAnoPorDotação',
      path: 'realizado/:ano/dotacao',
      component: AddRealizado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'ProjetoOrçamentoRealizado',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'ProjetoOrçamentoRealizado',
        ],
      },
    },
    {
      name: 'ProjetoOrçamentoRealizadoPorAnoPorProcesso',
      path: 'realizado/:ano/processo',
      component: AddRealizadoProcesso,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'ProjetoOrçamentoRealizado',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'ProjetoOrçamentoRealizado',
        ],
      },
    },
    {
      name: 'ProjetoOrçamentoRealizadoPorAnoPorNota',
      path: 'realizado/:ano/nota',
      component: AddRealizadoNota,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'ProjetoOrçamentoRealizado',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'ProjetoOrçamentoRealizado',
        ],
      },
    },
    {
      name: 'ProjetoOrçamentoRealizadoPorAnoPorId',
      path: 'realizado/:ano/:id',
      component: EditRealizado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'ProjetoOrçamentoRealizado',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'ProjetoOrçamentoRealizado',
        ],
      },
    },
    {
      path: 'realizado/:ano/dotacao/:id',
      component: EditRealizado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'ProjetoOrçamentoRealizado',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'ProjetoOrçamentoRealizado',
        ],
      },
    },

  ],
};

import OrcamentosLista from '@/views/mdo.orcamentos/OrcamentosLista.vue';
import OrcamentosRaiz from '@/views/mdo.orcamentos/OrcamentosRaiz.vue';
import AddEditCusteio from '@/views/orcamento/AddEditCusteio.vue';
import AddEditPlanejado from '@/views/orcamento/AddEditPlanejado.vue';
import AddRealizado from '@/views/orcamento/AddRealizado.vue';
import AddRealizadoNota from '@/views/orcamento/AddRealizadoNota.vue';
import AddRealizadoProcesso from '@/views/orcamento/AddRealizadoProcesso.vue';
import EditRealizado from '@/views/orcamento/EditRealizado.vue';

export default {
  path: 'orcamentos',
  component: OrcamentosRaiz,
  name: 'obrasOrcamentosRaiz',

  props: ({ params }) => ({
    ...params,
    obraId: Number.parseInt(params.obraId, 10) || undefined,
  }),
  redirect: () => ({ name: 'obrasOrçamentoCusto' }),
  meta: {
    título: 'Orçamentos',
    limitarÀsPermissões: [
      'ProjetoMDO.orcamento',
    ],
    rotasParaMigalhasDePão: [
      'obrasListar',
      'obrasResumo',
      'obrasOrcamentosRaiz',
    ],
    rotaPrescindeDeChave: false,
  },

  children: [
    {
      name: 'obrasOrçamentoCusto',
      path: 'custo',
      component: OrcamentosLista,
      meta: {
        títuloParaMenu: 'Previsão de custo',
        título: 'Previsão de custo',
        area: 'Custo',
        rotaParaAdição: 'obrasOrçamentoCustoPorAno',
        rotaParaEdição: 'obrasOrçamentoCustoPorAnoPorId',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
        ],
      },
    },
    {
      name: 'obrasOrçamentoCustoPorAno',
      path: 'custo/:ano',
      component: AddEditCusteio,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'obrasOrçamentoCusto',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'obrasOrçamentoCusto',
        ],
      },
    },
    {
      name: 'obrasOrçamentoCustoPorAnoPorId',
      component: AddEditCusteio,
      path: 'custo/:ano/:id',
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'obrasOrçamentoCusto',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'obrasOrçamentoCusto',
        ],
      },
    },

    {
      name: 'obrasOrçamentoPlanejado',
      path: 'planejado',
      component: OrcamentosLista,
      meta: {
        títuloParaMenu: 'Orçamento planejado',
        título: 'Orçamento planejado',
        area: 'Planejado',
        rotaParaAdição: 'obrasOrçamentoPlanejadoPorAno',
        rotaParaEdição: 'obrasOrçamentoPlanejadoPorAnoPorId',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
        ],
      },
    },
    {
      name: 'obrasOrçamentoPlanejadoPorAno',
      path: 'planejado/:ano',
      component: AddEditPlanejado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'obrasOrçamentoPlanejado',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'obrasOrçamentoPlanejado',
        ],
      },
    },
    {
      name: 'obrasOrçamentoPlanejadoPorAnoPorId',
      path: 'planejado/:ano/:id',
      component: AddEditPlanejado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'obrasOrçamentoPlanejado',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'obrasOrçamentoPlanejado',
        ],
      },
    },

    {
      name: 'obrasOrçamentoRealizado',
      path: 'realizado',
      component: OrcamentosLista,
      meta: {
        títuloParaMenu: 'Execução orçamentária',
        título: 'Execução orçamentária',
        area: 'Realizado',
        rotaParaEdição: 'obrasOrçamentoRealizadoPorAnoPorId',
        rotasParaAdição: [
          {
            texto: 'Dotação',
            nome: 'obrasOrçamentoRealizadoPorAnoPorDotação',
          },
          {
            texto: 'Processo',
            nome: 'obrasOrçamentoRealizadoPorAnoPorProcesso',
          },
          {
            texto: 'Nota de empenho',
            nome: 'obrasOrçamentoRealizadoPorAnoPorNota',
          },
        ],
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
        ],
      },
    },
    {
      name: 'obrasOrçamentoRealizadoPorAnoPorDotação',
      path: 'realizado/:ano/dotacao',
      component: AddRealizado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'obrasOrçamentoRealizado',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'obrasOrçamentoRealizado',
        ],
      },
    },
    {
      name: 'obrasOrçamentoRealizadoPorAnoPorProcesso',
      path: 'realizado/:ano/processo',
      component: AddRealizadoProcesso,
      props: true,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'obrasOrçamentoRealizado',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'obrasOrçamentoRealizado',
        ],
      },
    },
    {
      name: 'obrasOrçamentoRealizadoPorAnoPorNota',
      path: 'realizado/:ano/nota',
      component: AddRealizadoNota,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'obrasOrçamentoRealizado',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'obrasOrçamentoRealizado',
        ],
      },
    },
    {
      name: 'obrasOrçamentoRealizadoPorAnoPorId',
      path: 'realizado/:ano/:id',
      component: EditRealizado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'obrasOrçamentoRealizado',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'obrasOrçamentoRealizado',
        ],
      },
    },
    {
      path: 'realizado/:ano/dotacao/:id',
      component: EditRealizado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'obrasOrçamentoRealizado',
        rotasParaMigalhasDePão: [
          'obrasListar',
          'obrasResumo',
          'obrasOrçamentoRealizado',
        ],
      },
    },

  ],
};

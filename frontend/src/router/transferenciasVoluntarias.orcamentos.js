import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import AddRealizado from '@/views/orcamento/AddRealizado.vue';
import AddRealizadoNota from '@/views/orcamento/AddRealizadoNota.vue';
import AddRealizadoProcesso from '@/views/orcamento/AddRealizadoProcesso.vue';
import EditRealizado from '@/views/orcamento/EditRealizado.vue';
import OrcamentosLista from '@/views/transferenciasVoluntarias.orcamentos/OrcamentosLista.vue';
import OrcamentosRaiz from '@/views/transferenciasVoluntarias.orcamentos/OrcamentosRaiz.vue';

import tiparPropsDeRota from './helpers/tiparPropsDeRota';

const rotasParaMigalhasDePao = [
  'TransferenciasVoluntariasListar',
  'TransferenciasVoluntariasDetalhes',
  'TransferenciaOrcamentoRealizado',
];

export default {
  path: 'execucao-orcamentaria',
  component: OrcamentosRaiz,
  props: tiparPropsDeRota,
  meta: {
    // herdado pelas telas de inclusão e edição, que o exibem como subtítulo
    título: () => (useTransferenciasVoluntariasStore()?.emFoco?.identificador
      ? `Execução orçamentária da transferência ${useTransferenciasVoluntariasStore().emFoco.identificador}`
      : 'Execução orçamentária'),
    limitarÀsPermissões: 'CadastroTransferencia.listar',
  },

  children: [
    {
      name: 'TransferenciaOrcamentoRealizado',
      path: '',
      component: OrcamentosLista,
      meta: {
        títuloParaMenu: 'Execução orçamentária',
        rotaParaEdição: 'TransferenciaOrcamentoRealizadoPorId',
        rotasParaAdição: [
          {
            texto: 'Dotação',
            nome: 'TransferenciaOrcamentoRealizadoPorDotacao',
          },
          {
            texto: 'Processo',
            nome: 'TransferenciaOrcamentoRealizadoPorProcesso',
          },
          {
            texto: 'Nota de empenho',
            nome: 'TransferenciaOrcamentoRealizadoPorNota',
          },
        ],
        rotasParaMigalhasDePão: rotasParaMigalhasDePao.slice(0, -1),
      },
    },
    {
      name: 'TransferenciaOrcamentoRealizadoPorDotacao',
      path: 'dotacao',
      component: AddRealizado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'TransferenciaOrcamentoRealizado',
        limitarÀsPermissões: 'CadastroTransferencia.editar',
        rotasParaMigalhasDePão: rotasParaMigalhasDePao,
      },
    },
    {
      name: 'TransferenciaOrcamentoRealizadoPorProcesso',
      path: 'processo',
      component: AddRealizadoProcesso,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'TransferenciaOrcamentoRealizado',
        limitarÀsPermissões: 'CadastroTransferencia.editar',
        rotasParaMigalhasDePão: rotasParaMigalhasDePao,
      },
    },
    {
      name: 'TransferenciaOrcamentoRealizadoPorNota',
      path: 'nota',
      component: AddRealizadoNota,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'TransferenciaOrcamentoRealizado',
        limitarÀsPermissões: 'CadastroTransferencia.editar',
        rotasParaMigalhasDePão: rotasParaMigalhasDePao,
      },
    },
    {
      name: 'TransferenciaOrcamentoRealizadoPorId',
      path: ':id',
      component: EditRealizado,
      meta: {
        títuloParaMenu: '',
        rotaDeEscape: 'TransferenciaOrcamentoRealizado',
        limitarÀsPermissões: 'CadastroTransferencia.editar',
        rotasParaMigalhasDePão: rotasParaMigalhasDePao,
      },
    },
  ],
};

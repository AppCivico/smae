import TransferenciaDistribuicaoDeRecursosCriarEditar from '@/views/transferenciasVoluntarias/TransferenciaDistribuicaoDeRecursosCriarEditar.vue';
import RegistroDeTransferenciaCriarEditar from '@/views/transferenciasVoluntarias/RegistroDeTransferenciaCriarEditar.vue';
import TransferenciasVoluntariasCriarEditar from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasCriarEditar.vue';
import TransferenciasVoluntariasLista from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasLista.vue';
import TransferenciasVoluntariasRaiz from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasRaiz.vue';
import TransferenciasVoluntariasDocumentos from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasDocumentos.vue';


export default {
  path: '/trasferencias-voluntarias',
  component: TransferenciasVoluntariasRaiz,
  meta: {
    título: 'Transfêrencias Voluntarias',
    rotaPrescindeDeChave: true,
    presenteNoMenu: true,
    limitarÀsPermissões: 'CadastroTransferencia.listar',
  },
  children: [
    {
      name: 'TransferenciasVoluntariasListar',
      path: '',
      component: TransferenciasVoluntariasLista,
      meta: {
        título: 'Transferências Voluntarias',
      },
    },
    {
      name: 'TransferenciasVoluntariaCriar',
      path: 'novo',
      component: TransferenciasVoluntariasCriarEditar, //Dev - teste
      meta: {
        título: 'Formulário de registro',
      },
    },
    {
      path: ':transferenciaId',
      name: 'TransferenciasVoluntariaEditar',
      component: RegistroDeTransferenciaCriarEditar,
      props: ({ params }) => ({
        ...params,
        ...{ transferenciaId: Number.parseInt(params.transferenciaId, 10) || undefined },
      }),

      meta: {
        título: 'Editar Trasferência',
        rotasParaMenuSecundário: [
          'TransferenciasVoluntariasDocumentos'
        ],
      },
    },
    {
      path: ':transferenciaId/documentos',
      component: TransferenciasVoluntariasDocumentos,
      name: 'TransferenciasVoluntariasDocumentos',
      props: true,
      meta: {
        título: 'Transferencia documento',
        rotasParaMenuSecundário: [
          'TransferenciasVoluntariasDocumentos'
        ],
      },
    },
  ],
}

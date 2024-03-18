import RegistroDeTransferenciaCriarEditar from '@/views/transferenciasVoluntarias/RegistroDeTransferenciaCriarEditar.vue';
import TransferenciasVoluntariasLista from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasLista.vue';
import TransferenciasVoluntariasRaiz from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasRaiz.vue';


export default {
  path: '/trasferencias-voluntarias',
  component: TransferenciasVoluntariasRaiz,
  meta: {
    título: 'Transfêrencias Voluntarias',
    rotaPrescindeDeChave: true,
    presenteNoMenu: true,
    rotasParaMenuSecundário: [],
    limitarÀsPermissões: 'CadastroTransferencia.listar',
  },
  children: [
    {
      name: 'TransferenciasVoluntariasListar',
      path: '',
      component: TransferenciasVoluntariasLista,
      meta: {
        título: 'Transfêrencias Voluntarias',
      },
    },
    {
      name: 'TransferenciasVoluntariaCriar',
      path: 'novo',
      component: RegistroDeTransferenciaCriarEditar,
      meta: {
        título: 'Formulário de registro',
      },
    },
    {
      path: ':tipoId',
      name: 'TransferenciasVoluntariaEditar',
      component: RegistroDeTransferenciaCriarEditar,
      props: ({ params }) => ({
        ...params,
        ...{ tipoId: Number.parseInt(params.tipoId, 10) || undefined },
      }),

      meta: {
        título: 'Editar Tipo de Trasferência',
      },
    },
  ],
}

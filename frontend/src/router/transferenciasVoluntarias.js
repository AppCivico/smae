import EmailModal from '@/components/EmailModal.vue';
import NotaDetalhe from '@/components/notas/NotaDetalhe.vue';
import NotasCriarEditar from '@/components/notas/NotasCriarEditar.vue';
import NotasLista from '@/components/notas/NotasLista.vue';
import NotasRaiz from '@/components/notas/NotasRaiz.vue';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { useDistribuicaoRecursosStore } from '@/stores/transferenciasDistribuicaoRecursos.store';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import DialogWrapper from '@/views/DialogWrapper.vue';
import TarefasCriarEditar from '@/views/tarefas/TarefasCriarEditar.vue';
import TarefasItem from '@/views/tarefas/TarefasItem.vue';
import TarefasLista from '@/views/tarefas/TarefasLista.vue';
import TarefasProgresso from '@/views/tarefas/TarefasProgresso.vue';
import TarefasRaiz from '@/views/tarefas/TarefasRaiz.vue';
import RegistroDeTransferenciaCriarEditar from '@/views/transferenciasVoluntarias/RegistroDeTransferenciaCriarEditar.vue';
import TransferenciaDistribuicaoDeRecursosCriarEditar from '@/views/transferenciasVoluntarias/TransferenciaDistribuicaoDeRecursos/TransferenciaDistribuicaoDeRecursosCriarEditar.vue';
import TransferenciaDistribuicaoDeRecursosEditarRaiz from '@/views/transferenciasVoluntarias/TransferenciaDistribuicaoDeRecursos/TransferenciaDistribuicaoDeRecursosEditarRaiz.vue';
import TransferenciaDistribuicaoDeRecursosLista from '@/views/transferenciasVoluntarias/TransferenciaDistribuicaoDeRecursos/TransferenciaDistribuicaoDeRecursosLista.vue';
import TransferenciaDistribuicaoDeRecursosStatus from '@/views/transferenciasVoluntarias/TransferenciaDistribuicaoDeRecursos/TransferenciaDistribuicaoDeRecursosStatus.vue';
import TransferenciasVoluntariasCriarEditar from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasCriarEditar.vue';
import TransferenciasVoluntariasDocumentos from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasDocumentos.vue';
import TransferenciasVoluntariasEnviarArquivo from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasEnviarArquivo.vue';
import TransferenciasVoluntariasLista from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasLista.vue';
import TransferenciasVoluntariasRaiz from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasRaiz.vue';
import TransferenciasVoluntariasVinculos from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasVinculos.vue';
import TransferenciasVoluntariasVinculoEditar from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasVinculoEditar.vue';
import TransferenciasVoluntariasDetalhesConsultaGeral from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasDetalhesConsultaGeral.vue';
import tiparPropsDeRota from './helpers/tiparPropsDeRota';

const rotasParaMenuSecundário = [
  {
    rotas: [
      'TransferenciasVoluntariasDetalhes',
      'TransferenciasVoluntarias.Monitoramento',
      'TransferenciasVoluntariasNotas',
      'TransferenciasVoluntariasDocumentos',
      'TransferenciaCronograma',
      'TransferenciasVoluntariasVinculos',
    ],
  },
  {
    título: 'Transferência',
    rotas: [
      'TransferenciasVoluntariaEditar',
      'RegistroDeTransferenciaEditar',
      'TransferenciaDistribuicaoDeRecursos.Lista',
    ],
  },
];

export default {
  path: '/transferencias-voluntarias',
  component: TransferenciasVoluntariasRaiz,
  meta: {
    título: 'Transfêrencias Voluntarias',
    rotaPrescindeDeChave: true,
    íconeParaMenu:
      '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.4393 3.43981C14.7016 3.17721 15.0521 3.02122 15.4228 3.00201C15.7935 2.9828 16.1582 3.10173 16.4463 3.33581L16.5603 3.43881L20.3893 7.26881C21.3633 8.24281 20.7293 9.88581 19.3983 9.99381L19.2583 9.99981H3.49926C3.11404 9.99962 2.74366 9.85124 2.46487 9.5854C2.18608 9.31957 2.02025 8.95667 2.00173 8.5719C1.98322 8.18713 2.11345 7.80998 2.36543 7.51861C2.61742 7.22724 2.97184 7.04398 3.35526 7.00681L3.49926 6.99981H15.8783L14.4383 5.55981C14.1574 5.27856 13.9996 4.89731 13.9996 4.49981C13.9996 4.10231 14.1584 3.72106 14.4393 3.43981Z"  fill="currentColor"/><path d="M20.5336 14.4142C20.2549 14.1484 19.8845 14 19.4993 13.9998H3.74026L3.60026 14.0058C2.26926 14.1138 1.63526 15.7568 2.60926 16.7308L6.43826 20.5608L6.55226 20.6638C6.8504 20.9075 7.23084 21.0272 7.61479 20.9981C7.99875 20.969 8.35682 20.7934 8.61486 20.5076C8.8729 20.2218 9.01116 19.8477 9.00099 19.4628C8.99083 19.0779 8.83303 18.7116 8.56026 18.4398L7.12026 16.9998H19.4993L19.6433 16.9928C20.0267 16.9556 20.3811 16.7724 20.6331 16.481C20.8851 16.1896 21.0153 15.8125 20.9968 15.4277C20.9783 15.043 20.8124 14.6801 20.5336 14.4142Z"  fill="currentColor"/></svg>',
    limitarÀsPermissões: 'CadastroTransferencia.listar',
    entidadeMãe: 'TransferenciasVoluntarias',
  },
  children: [
    {
      path: 'consulta-geral',
      component: () => import('@/views/ConsultaGeral/ConsultaGeralIndex.vue'),
      name: 'consultaGeral',
      meta: {
        título: 'Consulta Geral',
        tituloSingular: 'Consulta Geral',
        tituloPlural: 'Consulta Geral',
        íconeParaMenu: `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none">
          <path d="M12.7499 16.5015C14.0849 16.5015 15.39 16.1057 16.5 15.364C17.61 14.6223 18.4752 13.5681 18.9861 12.3347C19.497 11.1013 19.6307 9.74405 19.3702 8.43468C19.1098 7.12531 18.4669 5.92257 17.5229 4.97857C16.5789 4.03456 15.3761 3.39169 14.0668 3.13124C12.7574 2.87079 11.4002 3.00446 10.1668 3.51535C8.93339 4.02624 7.87919 4.89141 7.13749 6.00144C6.39579 7.11147 5.99991 8.41652 5.99991 9.75154C6.00189 11.5411 6.71369 13.2569 7.97913 14.5223C9.24457 15.7878 10.9603 16.4996 12.7499 16.5015ZM12.7499 5.25154C13.6399 5.25154 14.51 5.51546 15.25 6.00993C15.99 6.50439 16.5668 7.2072 16.9074 8.02946C17.248 8.85173 17.3371 9.75653 17.1634 10.6294C16.9898 11.5024 16.5612 12.3042 15.9319 12.9335C15.3026 13.5629 14.5007 13.9914 13.6278 14.1651C12.7549 14.3387 11.8501 14.2496 11.0278 13.909C10.2056 13.5684 9.50276 12.9916 9.0083 12.2516C8.51383 11.5116 8.24991 10.6416 8.24991 9.75154C8.25115 8.55845 8.72565 7.41457 9.5693 6.57093C10.4129 5.72728 11.5568 5.25278 12.7499 5.25154ZM13.8749 20.1906V21.3765H15.7499C16.0483 21.3765 16.3344 21.4951 16.5454 21.706C16.7564 21.917 16.8749 22.2032 16.8749 22.5015C16.8749 22.7999 16.7564 23.0861 16.5454 23.297C16.3344 23.508 16.0483 23.6265 15.7499 23.6265H9.74991C9.45154 23.6265 9.16539 23.508 8.95441 23.297C8.74343 23.0861 8.62491 22.7999 8.62491 22.5015C8.62491 22.2032 8.74343 21.917 8.95441 21.706C9.16539 21.4951 9.45154 21.3765 9.74991 21.3765H11.6249V20.1915C9.68881 19.983 7.84885 19.2401 6.31066 18.046C4.77247 16.8518 3.59665 15.2535 2.91461 13.4295C2.23258 11.6056 2.07119 9.6279 2.44849 7.7175C2.82579 5.8071 3.72692 4.03926 5.05116 2.61154C5.15067 2.4997 5.27151 2.40884 5.40659 2.3443C5.54167 2.27976 5.68828 2.24282 5.83781 2.23566C5.98735 2.2285 6.13681 2.25126 6.27744 2.3026C6.41807 2.35395 6.54703 2.43284 6.65678 2.53467C6.76653 2.63649 6.85485 2.75919 6.91656 2.89559C6.97828 3.03198 7.01216 3.17932 7.0162 3.32897C7.02025 3.47863 6.99438 3.62758 6.94013 3.76711C6.88587 3.90664 6.80431 4.03394 6.70022 4.14154C5.24485 5.70577 4.45308 7.77362 4.49157 9.90985C4.53007 12.0461 5.39582 14.0841 6.9066 15.5948C8.41739 17.1056 10.4554 17.9714 12.5916 18.0099C14.7278 18.0484 16.7957 17.2566 18.3599 15.8012C18.4675 15.6971 18.5948 15.6156 18.7343 15.5613C18.8739 15.5071 19.0228 15.4812 19.1725 15.4852C19.3221 15.4893 19.4695 15.5232 19.6059 15.5849C19.7423 15.6466 19.865 15.7349 19.9668 15.8447C20.0686 15.9544 20.1475 16.0834 20.1988 16.224C20.2502 16.3646 20.2729 16.5141 20.2658 16.6636C20.2586 16.8132 20.2217 16.9598 20.1571 17.0949C20.0926 17.2299 20.0018 17.3508 19.8899 17.4503C18.2341 18.9903 16.1235 19.9518 13.8749 20.1906Z" fill="#F7C234"/>
          </svg>`,
      },

      children: [
        /* DETALHES DA ENTIDADE (Projeto/Meta/Iniciativa/Atividade) */
        {
          path: ':id',
          component: DialogWrapper,
          meta: {
            rotaDeEscape: 'consultaGeral',
            título: 'Detalhes',
            títuloParaMenu: 'Detalhes',
          },
          children: [
            {
              path: '',
              name: 'DetalhesConsultaGeral',
              component: TransferenciasVoluntariasDetalhesConsultaGeral,
            },
          ],
        },
      ],
    },
    {
      name: 'TransferenciasVoluntariasListar',
      path: '',
      component: TransferenciasVoluntariasLista,
      meta: {
        título: 'Transferências Voluntárias',
      },
    },
    {
      name: 'TransferenciasVoluntariaCriar',
      path: 'novo',
      component: TransferenciasVoluntariasCriarEditar,
      meta: {
        título: 'Formulário de registro',
        limitarÀsPermissões: 'CadastroTransferencia.editar',
        rotasParaMigalhasDePão: ['TransferenciasVoluntariasListar'],
      },
    },
    {
      path: ':transferenciaId/distribuicao-de-recursos',
      meta: {
        título: 'Distribuição de recursos',
        rotasParaMenuSecundário,
        limitarÀsPermissões: 'CadastroTransferencia.editar',
        rotasParaMigalhasDePão: [
          'TransferenciasVoluntariasListar',
          'TransferenciasVoluntariasDetalhes',
        ],
      },
      props: tiparPropsDeRota,
      children: [
        {
          name: 'TransferenciaDistribuicaoDeRecursos.Lista',
          path: '',
          component: TransferenciaDistribuicaoDeRecursosLista,
        },
        {
          path: '',
          component: TransferenciaDistribuicaoDeRecursosEditarRaiz,
          children: [
            {
              name: 'TransferenciaDistribuicaoDeRecursos.Novo',
              path: 'novo',
              component: TransferenciaDistribuicaoDeRecursosCriarEditar,
              meta: {
                título: 'Novo Recurso',
                rotaDeEscape: 'TransferenciaDistribuicaoDeRecursos.Lista',
                rotasParaMigalhasDePão: [
                  'TransferenciasVoluntariasListar',
                  'TransferenciasVoluntariasDetalhes',
                  'TransferenciaDistribuicaoDeRecursos.Lista',
                ],
              },
            },
          ],
        },
        {
          path: ':recursoId',
          component: TransferenciaDistribuicaoDeRecursosEditarRaiz,
          children: [
            {
              meta: {
                título: () => {
                  const distribuicaoRecursosStore = useDistribuicaoRecursosStore();
                  if (!distribuicaoRecursosStore.itemParaEdicao?.nome) {
                    return '';
                  }

                  return distribuicaoRecursosStore.itemParaEdicao.nome;
                },
                rotaDeEscape: 'TransferenciaDistribuicaoDeRecursos.Lista',
                rotasParaMigalhasDePão: [
                  'TransferenciasVoluntariasListar',
                  'TransferenciasVoluntariasDetalhes',
                  'TransferenciaDistribuicaoDeRecursos.Lista',
                ],
              },
              path: '',
              name: 'TransferenciaDistribuicaoDeRecursos.Editar',
              component: TransferenciaDistribuicaoDeRecursosCriarEditar,
            },
            {
              path: 'status',
              name: 'TransferenciaDistribuicaoDeRecursos.Editar.Status',
              component: TransferenciaDistribuicaoDeRecursosStatus,
              meta: {
                título: 'Histórico de Status',
                rotasParaMigalhasDePão: [
                  'TransferenciasVoluntariasListar',
                  'TransferenciasVoluntariasDetalhes',
                  'TransferenciaDistribuicaoDeRecursos.Lista',
                  'TransferenciaDistribuicaoDeRecursos.Editar',
                ],
              },
            },
          ],
        },
      ],
    },
    {
      name: 'RegistroDeTransferenciaEditar',
      path: ':transferenciaId/registro',
      component: RegistroDeTransferenciaCriarEditar,
      props: ({ params }) => ({
        ...params,
        ...{
          transferenciaId:
            Number.parseInt(params.transferenciaId, 10) || undefined,
        },
      }),
      meta: {
        título: 'Recurso financeiro',
        títuloParaMenu: 'Recurso financeiro',
        rotasParaMenuSecundário,
        limitarÀsPermissões: 'CadastroTransferencia.editar',
        rotasParaMigalhasDePão: [
          'TransferenciasVoluntariasListar',
          'TransferenciasVoluntariasDetalhes',
        ],
      },
    },
    /* NOTAS */
    {
      name: 'TransferenciasVoluntariasNotas',
      path: ':transferenciaId/notas',
      component: NotasRaiz,
      props: ({ params }) => ({
        ...params,
        ...{
          transferenciaId:
            Number.parseInt(params.transferenciaId, 10) || undefined,
        },
      }),
      meta: {
        título: 'Notas',
        rotaPrescindeDeChave: true,
        rotasParaMenuSecundário,
      },
      children: [
        /* LISTAR NOTAS */
        {
          name: 'notasListar',
          path: '',
          component: NotasLista,
          meta: {
            título: 'Notas',
            rotasParaMigalhasDePão: [
              'TransferenciasVoluntariasListar',
              'TransferenciasVoluntariasDetalhes',
            ],
          },
        },
        /* FIM DE LISTAR NOTAS */
        /* DETALHE DA NOTA */
        {
          path: ':notaId/detalhes',
          name: 'notaDetalhe',
          component: NotaDetalhe,
          props: ({ params }) => ({
            ...params,
            ...{ notaId: params.notaId || undefined },
          }),
          meta: {
            título: 'Nota',
            rotasParaMigalhasDePão: [
              'TransferenciasVoluntariasListar',
              'TransferenciasVoluntariasDetalhes',
              'notasListar',
            ],
          },
        },
        /* FIM DE DETALHE DA NOTA */
        /* INCLUSÃO DE NOTA */
        {
          name: 'notasCriar',
          path: 'nova',
          component: NotasCriarEditar,
          meta: {
            título: 'Nova nota',
            rotaDeEscape: 'notasListar',
            limitarÀsPermissões: 'CadastroTransferencia.editar',
            rotasParaMigalhasDePão: [
              'TransferenciasVoluntariasListar',
              'TransferenciasVoluntariasDetalhes',
              'notasListar',
            ],
          },
        },
        /* FIM DE INCLUSÃO DE NOTA */
        /* EDIÇÃO DE NOTA */
        {
          path: ':notaId',
          name: 'notasEditar',
          component: NotasCriarEditar,
          props: ({ params }) => ({
            ...params,
            ...{ notaId: params.notaId || undefined },
          }),

          meta: {
            título: 'Editar nota',
            rotaDeEscape: 'notasListar',
            limitarÀsPermissões: 'CadastroTransferencia.editar',
            rotasParaMigalhasDePão: [
              'TransferenciasVoluntariasListar',
              'TransferenciasVoluntariasDetalhes',
              'notasListar',
            ],
          },
        },
        /* FIM DE EDIÇÃO DE NOTA */
      ],
    },
    /* FIM DE NOTAS */
    {
      path: ':transferenciaId',
      component: () => import(
        '@/views/transferenciasVoluntarias/TransferenciasVoluntariasItem.vue'
      ),
      props: tiparPropsDeRota,
      meta: {
        título: 'Identificação',
        rotasParaMenuSecundário,
        limitarÀsPermissões: 'CadastroTransferencia.editar',
        rotasParaMigalhasDePão: [
          'TransferenciasVoluntariasListar',
          'TransferenciasVoluntariasDetalhes',
        ],
        rotaDeEscape: 'TransferenciasVoluntariasDetalhes',
      },
      children: [
        {
          name: 'TransferenciasVoluntariaEditar',
          component: TransferenciasVoluntariasCriarEditar,
          path: '',
          props: tiparPropsDeRota,
        },
        {
          name: 'TransferenciasVoluntariasDetalhes',
          path: 'resumo',
          component: () => import(
            '@/views/transferenciasVoluntarias/TransferenciasVoluntariasDetalhes.vue'
          ),
          props: tiparPropsDeRota,
          meta: {
            títuloParaMenu: 'Resumo',
            título: () => {
              const { emFoco } = useTransferenciasVoluntariasStore();

              if (!emFoco?.identificador) {
                return 'Resumo de transferência';
              }

              return `Resumo da transferência ${emFoco.identificador}`;
            },
            tituloParaMigalhaDePao: () => {
              const { emFoco } = useTransferenciasVoluntariasStore();

              if (!emFoco?.identificador) {
                return 'Resumo de transferência';
              }

              return `Resumo da transferência ${emFoco.identificador}`;
            },
            rotasParaMenuSecundário,
            rotasParaMigalhasDePão: [
              'TransferenciasVoluntariasListar',
              'TransferenciasVoluntariasDetalhes',
            ],
          },
        },
        {
          name: 'TransferenciasVoluntarias.Monitoramento',
          component: () => import(
            '@/views/transferenciasVoluntarias/TransferenciasVoluntarias.Monitoramento.vue'
          ),
          path: 'monitoramento',
          props: tiparPropsDeRota,
          meta: {
            título: () => (useTransferenciasVoluntariasStore()?.emFoco?.identificador
              ? `Monitoramento da transferência ${
                useTransferenciasVoluntariasStore()?.emFoco?.identificador
              }`
              : 'Monitoramento de transferência'),
            títuloParaMenu: 'Monitoramento',
            rotaDeEscape: 'TransferenciasVoluntariasDetalhes',
          },
        },
      ],
    },
    /* DOCUMENTOS */
    {
      path: ':transferenciaId/documentos',
      component: TransferenciasVoluntariasDocumentos,
      name: 'TransferenciasVoluntariasDocumentos',
      props: ({ params }) => ({
        ...params,
        transferenciaId:
          Number.parseInt(params.transferenciaId, 10) || undefined,
      }),
      meta: {
        título: 'Documentos',
        rotasParaMenuSecundário,
        rotasParaMigalhasDePão: [
          'TransferenciasVoluntariasListar',
          'TransferenciasVoluntariasDetalhes',
        ],
      },
      children: [
        /* INCLUSÃO DE DOCUMENTO */
        {
          path: 'novo',
          component: DialogWrapper,
          meta: {
            rotaDeEscape: 'TransferenciasVoluntariasDocumentos',
            título: 'Novo documento transferência',
            títuloParaMenu: 'Novo documento',
            limitarÀsPermissões: 'CadastroTransferencia.editar',
          },
          children: [
            {
              path: '',
              name: 'TransferenciasVoluntariasEnviarArquivo',
              component: TransferenciasVoluntariasEnviarArquivo,
            },
          ],
        },
        /* FIM DE INCLUSÃO DE DOCUMENTO */
        /* EDIÇÃO DE DOCUMENTO */
        {
          path: ':arquivoId',
          component: DialogWrapper,
          props: ({ params }) => ({
            ...params,
            arquivoId: Number.parseInt(params.arquivoId, 10) || undefined,
          }),
          meta: {
            rotaDeEscape: 'TransferenciasVoluntariasDocumentos',
            título: 'Editar documento transferência',
            títuloParaMenu: 'Editar documento',
            limitarÀsPermissões: 'CadastroTransferencia.editar',
          },
          children: [
            {
              path: '',
              name: 'transferenciaEditarDocumento',
              component: TransferenciasVoluntariasEnviarArquivo,
            },
          ],
        },
        /* FIM DE EDIÇÃO DE DOCUMENTO */
      ],
    },
    /* FIM DE DOCUMENTOS */
    /* VÍNCULOS */
    {
      path: ':transferenciaId/vinculos',
      component: TransferenciasVoluntariasVinculos,
      name: 'TransferenciasVoluntariasVinculos',
      props: tiparPropsDeRota,
      meta: {
        título: 'Vínculos',
        rotasParaMenuSecundário,
        rotasParaMigalhasDePão: [
          'TransferenciasVoluntariasListar',
          'TransferenciasVoluntariasDetalhes',
        ],
      },
      children: [
        /* EDIÇÃO DE VÍNCULO */
        {
          path: ':vinculoId',
          component: DialogWrapper,
          props: tiparPropsDeRota,
          meta: {
            rotaDeEscape: 'TransferenciasVoluntariasVinculos',
            título: 'Editar vínculo',
            títuloParaMenu: 'Editar vínculo',
            limitarÀsPermissões: 'CadastroTransferencia.editar',
          },
          children: [
            {
              path: '',
              name: 'TransferenciasVoluntariasVinculosEditar',
              component: TransferenciasVoluntariasVinculoEditar,
              props: (route) => tiparPropsDeRota(route, {
                vinculoId: 'number',
                transferenciaId: 'number',
              }),
            },
          ],
        },
        /* FIM DE EDIÇÃO DE VÍNCULO */
      ],
    },
    /* FIM DE VÍNCULOS */
    /* TAREFAS E CRONOGRAMA */
    {
      path: ':transferenciaId/tarefas',
      component: TarefasRaiz,

      props: ({ params }) => ({
        ...params,
        transferenciaId:
          Number.parseInt(params.transferenciaId, 10) || undefined,
      }),

      meta: {
        títuloParaMenu: 'Tarefas',
        rotaPrescindeDeChave: true,
        rotasParaMenuSecundário,
      },
      children: [
        /* CRONOGRAMA */
        {
          name: 'TransferenciaCronograma',
          path: '',
          component: TarefasLista,
          meta: {
            título: 'Cronograma',
            títuloParaMenu: 'Cronograma',
            rotasParaMenuSecundário,
            rotasParaMigalhasDePão: [
              'TransferenciasVoluntariasListar',
              'TransferenciasVoluntariasDetalhes',
            ],
          },
          props: ({ params }) => ({
            ...params,
            transferenciaId:
              Number.parseInt(params.transferenciaId, 10) || undefined,
          }),

          children: [
            {
              path: 'disparo-email',
              component: DialogWrapper,
              meta: {
                rotaDeEscape: 'TransferenciaCronograma',
                título: 'Novo disparo de e-mail para cronograma',
                títuloParaMenu: 'Novo e-mail',
                limitarÀsPermissões: 'CadastroTransferencia.editar',
              },
              children: [
                {
                  path: '',
                  name: 'transferenciaEmailModal',
                  component: EmailModal,
                },
              ],
            },
          ],
        },
        /* FIM DE CRONOGRAMA */
        /* INCLUIR TAREFA */
        {
          name: 'TransferenciasVoluntarias.TarefasCriar',
          path: 'nova',
          component: TarefasCriarEditar,
          meta: {
            título: 'Nova tarefa',
            títuloParaMenu: 'Nova tarefa',
            rotaDeEscape: 'TransferenciaCronograma',
            limitarÀsPermissões: 'CadastroTransferencia.editar',
            rotasParaMigalhasDePão: [
              'TransferenciasVoluntariasListar',
              'TransferenciasVoluntariasDetalhes',
              'TransferenciaCronograma',
            ],
          },
        },
        /* FIM DE INCLUIR TAREFA */
        /* AÇÕES COM TAREFAS */
        {
          path: ':tarefaId',
          component: TarefasItem,
          props: ({ params }) => ({
            ...params,
            transferenciaId:
              Number.parseInt(params.transferenciaId, 10) || undefined,
            tarefaId: Number.parseInt(params.tarefaId, 10) || undefined,
          }),

          children: [
            /* DETALHE DA TAREFA */
            {
              name: 'TransferenciasVoluntarias.TarefasDetalhes',
              path: 'resumo',
              component: () => import('@/views/tarefas/TarefasDetalhe.vue'),
              props: ({ params }) => ({
                ...params,
                tarefaId: Number.parseInt(params.tarefaId, 10) || undefined,
                transferenciaId:
                  Number.parseInt(params.transferenciaId, 10) || undefined,
              }),
              meta: {
                título: 'Resumo Atividade',
                rotaDeEscape: 'TransferenciasVoluntariasListar',
                rotasParaMigalhasDePão: [
                  'TransferenciasVoluntariasListar',
                  'TransferenciasVoluntariasDetalhes',
                  'TransferenciaCronograma',
                ],
              },
            },
            /* FIM DE DETALHE DA TAREFA */
            /* EDITAR TAREFA */
            {
              path: 'teste',
              name: 'TransferenciasVoluntarias.TarefasEditar',
              component: TarefasCriarEditar,
              props: ({ params }) => ({
                ...params,
                transferenciaId:
                  Number.parseInt(params.transferenciaId, 10) || undefined,
                tarefasId: Number.parseInt(params.tarefaId, 10) || undefined,
              }),
              meta: {
                título: () => useTarefasStore()?.emFoco?.tarefa || 'Editar tarefa',
                títuloParaMenu: 'Editar tarefa',
                rotaDeEscape: 'TransferenciaCronograma',
                limitarÀsPermissões: 'CadastroTransferencia.editar',
                rotasParaMigalhasDePão: [
                  'TransferenciasVoluntariasListar',
                  'TransferenciasVoluntariasDetalhes',
                  'TransferenciaCronograma',
                ],
              },
            },
            /* FIM DE EDITAR TAREFA */
            /* PROGRESSO DA TAREFA */
            {
              path: 'progresso',
              name: 'TransferenciasVoluntarias.TarefasProgresso',
              component: TarefasProgresso,
              props: ({ params }) => ({
                ...params,
                transferenciaId:
                  Number.parseInt(params.transferenciaId, 10) || undefined,
                tarefaId: Number.parseInt(params.tarefaId, 10) || undefined,
              }),
              meta: {
                título: () => (useTarefasStore()?.emFoco?.tarefa
                  ? `Registro de progresso de ${
                    useTarefasStore().emFoco.tarefa
                  }`
                  : 'Registrar progresso'),
                títuloParaMenu: 'Progresso',
                rotaDeEscape: 'TransferenciaCronograma',
                limitarÀsPermissões: 'CadastroTransferencia.editar',
                rotasParaMigalhasDePão: [
                  'TransferenciasVoluntariasListar',
                  'TransferenciasVoluntariasDetalhes',
                  'TransferenciaCronograma',
                ],
              },
              children: [
                {
                  path: 'disparo-email-tarefa',
                  component: DialogWrapper,
                  meta: {
                    rotaDeEscape: 'TransferenciasVoluntarias.TarefasProgresso',
                    título: 'Novo disparo de e-mail',
                    títuloParaMenu: 'Novo e-mail',
                    limitarÀsPermissões: 'CadastroTransferencia.editar',
                  },
                  children: [
                    {
                      path: '',
                      name: 'transferenciaTarefaEmailModal',
                      component: EmailModal,
                    },
                  ],
                },
              ],
            },
            /* FIM DE PROGRESSO DA TAREFA */
          ],
        },
        /* FIM DE AÇÕES COM TAREFAS */
      ],
    },
    /* FIM DE TAREFAS E CRONOGRAMA */
  ],
};

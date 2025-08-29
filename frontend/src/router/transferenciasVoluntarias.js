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
import tiparPropsDeRota from './helpers/tiparPropsDeRota';

const rotasParaMenuSecundário = [
  {
    rotas: [
      'TransferenciasVoluntariasDetalhes',
      'TransferenciasVoluntarias.Monitoramento',
      'TransferenciasVoluntariasNotas',
      'TransferenciasVoluntariasDocumentos',
      'TransferenciaCronograma',
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
        íconeParaMenu: `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path fill-rule="evenodd" clip-rule="evenodd" d="M16 15C17.306 15 18.418 15.835 18.83 17H20C20.2652 17 20.5196 17.1054 20.7071 17.2929C20.8946 17.4804 21 17.7348 21 18C21 18.2652 20.8946 18.5196 20.7071 18.7071C20.5196 18.8946 20.2652 19 20 19H18.83C18.6234 19.5855 18.2403 20.0926 17.7334 20.4512C17.2265 20.8099 16.6209 21.0025 16 21.0025C15.3791 21.0025 14.7735 20.8099 14.2666 20.4512C13.7597 20.0926 13.3766 19.5855 13.17 19H4C3.73478 19 3.48043 18.8946 3.29289 18.7071C3.10536 18.5196 3 18.2652 3 18C3 17.7348 3.10536 17.4804 3.29289 17.2929C3.48043 17.1054 3.73478 17 4 17H13.17C13.377 16.4149 13.7603 15.9084 14.2671 15.5502C14.774 15.1921 15.3794 14.9998 16 15ZM16 17C15.7348 17 15.4804 17.1054 15.2929 17.2929C15.1054 17.4804 15 17.7348 15 18C15 18.2652 15.1054 18.5196 15.2929 18.7071C15.4804 18.8946 15.7348 19 16 19C16.2652 19 16.5196 18.8946 16.7071 18.7071C16.8946 18.5196 17 18.2652 17 18C17 17.7348 16.8946 17.4804 16.7071 17.2929C16.5196 17.1054 16.2652 17 16 17ZM8 9C8.58899 8.99992 9.16497 9.17322 9.65613 9.49829C10.1473 9.82336 10.5319 10.2858 10.762 10.828L10.829 11H20C20.2549 11.0003 20.5 11.0979 20.6854 11.2728C20.8707 11.4478 20.9822 11.687 20.9972 11.9414C21.0121 12.1958 20.9293 12.4464 20.7657 12.6418C20.6021 12.8373 20.3701 12.9629 20.117 12.993L20 13H10.83C10.6284 13.5703 10.2592 14.0663 9.77073 14.4231C9.28229 14.7799 8.69744 14.9808 8.09285 14.9994C7.48827 15.018 6.89217 14.8534 6.38273 14.5273C5.87328 14.2012 5.47427 13.7288 5.238 13.172L5.17 13H4C3.74512 12.9997 3.49997 12.9021 3.31463 12.7272C3.1293 12.5522 3.01777 12.313 3.00283 12.0586C2.98789 11.8042 3.07067 11.5536 3.23426 11.3582C3.39786 11.1627 3.6299 11.0371 3.883 11.007L4 11H5.17C5.37701 10.4149 5.76032 9.90842 6.26715 9.55024C6.77397 9.19206 7.37938 8.99982 8 9ZM8 11C7.73478 11 7.48043 11.1054 7.29289 11.2929C7.10536 11.4804 7 11.7348 7 12C7 12.2652 7.10536 12.5196 7.29289 12.7071C7.48043 12.8946 7.73478 13 8 13C8.26522 13 8.51957 12.8946 8.70711 12.7071C8.89464 12.5196 9 12.2652 9 12C9 11.7348 8.89464 11.4804 8.70711 11.2929C8.51957 11.1054 8.26522 11 8 11ZM16 3C17.306 3 18.418 3.835 18.83 5H20C20.2652 5 20.5196 5.10536 20.7071 5.29289C20.8946 5.48043 21 5.73478 21 6C21 6.26522 20.8946 6.51957 20.7071 6.70711C20.5196 6.89464 20.2652 7 20 7H18.83C18.6234 7.58553 18.2403 8.09257 17.7334 8.45121C17.2265 8.80985 16.6209 9.00245 16 9.00245C15.3791 9.00245 14.7735 8.80985 14.2666 8.45121C13.7597 8.09257 13.3766 7.58553 13.17 7H4C3.73478 7 3.48043 6.89464 3.29289 6.70711C3.10536 6.51957 3 6.26522 3 6C3 5.73478 3.10536 5.48043 3.29289 5.29289C3.48043 5.10536 3.73478 5 4 5H13.17C13.377 4.41493 13.7603 3.90842 14.2671 3.55024C14.774 3.19206 15.3794 2.99982 16 3ZM16 5C15.7348 5 15.4804 5.10536 15.2929 5.29289C15.1054 5.48043 15 5.73478 15 6C15 6.26522 15.1054 6.51957 15.2929 6.70711C15.4804 6.89464 15.7348 7 16 7C16.2652 7 16.5196 6.89464 16.7071 6.70711C16.8946 6.51957 17 6.26522 17 6C17 5.73478 16.8946 5.48043 16.7071 5.29289C16.5196 5.10536 16.2652 5 16 5Z" fill="currentColor"/>
        </svg>`,
      },
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

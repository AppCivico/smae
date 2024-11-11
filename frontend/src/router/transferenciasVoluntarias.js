import EmailModal from '@/components/EmailModal.vue';
import NotaDetalhe from '@/components/notas/NotaDetalhe.vue';
import NotasCriarEditar from '@/components/notas/NotasCriarEditar.vue';
import NotasLista from '@/components/notas/NotasLista.vue';
import NotasRaiz from '@/components/notas/NotasRaiz.vue';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { useTransferenciasVoluntariasStore } from '@/stores/transferenciasVoluntarias.store';
import DialogWrapper from '@/views/DialogWrapper.vue';
import TarefasCriarEditar from '@/views/tarefas/TarefasCriarEditar.vue';
import TarefasItem from '@/views/tarefas/TarefasItem.vue';
import TarefasLista from '@/views/tarefas/TarefasLista.vue';
import TarefasProgresso from '@/views/tarefas/TarefasProgresso.vue';
import TarefasRaiz from '@/views/tarefas/TarefasRaiz.vue';
import RegistroDeTransferenciaCriarEditar from '@/views/transferenciasVoluntarias/RegistroDeTransferenciaCriarEditar.vue';
import TransferenciaDistribuicaoDeRecursosCriarEditarForm from '@/views/transferenciasVoluntarias/TransferenciaDistribuicaoDeRecursos/TransferenciaDistribuicaoDeRecursosCriarEditar.vue';
import TransferenciaDistribuicaoDeRecursosCriarEditar from '@/views/transferenciasVoluntarias/TransferenciaDistribuicaoDeRecursosCriarEditar.vue';
import TransferenciasVoluntariasCriarEditar from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasCriarEditar.vue';
import TransferenciasVoluntariasDetalhes from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasDetalhes.vue';
import TransferenciasVoluntariasDocumentos from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasDocumentos.vue';
import TransferenciasVoluntariasEnviarArquivo from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasEnviarArquivo.vue';
import TransferenciasVoluntariasLista from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasLista.vue';
import TransferenciasVoluntariasRaiz from '@/views/transferenciasVoluntarias/TransferenciasVoluntariasRaiz.vue';

const rotasParaMenuSecundário = [
  {
    rotas: [
      'TransferenciasVoluntariasDetalhes',
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
      // 'TransferenciaDistribuicaoDeRecursosEditarLista',
    ],
  },
];

export default {
  path: '/transferencias-voluntarias',
  component: TransferenciasVoluntariasRaiz,
  meta: {
    título: 'Transfêrencias Voluntarias',
    rotaPrescindeDeChave: true,
    presenteNoMenu: true,
    pesoNoMenu: 1,
    íconeParaMenu:
      '<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14.4393 3.43981C14.7016 3.17721 15.0521 3.02122 15.4228 3.00201C15.7935 2.9828 16.1582 3.10173 16.4463 3.33581L16.5603 3.43881L20.3893 7.26881C21.3633 8.24281 20.7293 9.88581 19.3983 9.99381L19.2583 9.99981H3.49926C3.11404 9.99962 2.74366 9.85124 2.46487 9.5854C2.18608 9.31957 2.02025 8.95667 2.00173 8.5719C1.98322 8.18713 2.11345 7.80998 2.36543 7.51861C2.61742 7.22724 2.97184 7.04398 3.35526 7.00681L3.49926 6.99981H15.8783L14.4383 5.55981C14.1574 5.27856 13.9996 4.89731 13.9996 4.49981C13.9996 4.10231 14.1584 3.72106 14.4393 3.43981Z"  fill="currentColor"/><path d="M20.5336 14.4142C20.2549 14.1484 19.8845 14 19.4993 13.9998H3.74026L3.60026 14.0058C2.26926 14.1138 1.63526 15.7568 2.60926 16.7308L6.43826 20.5608L6.55226 20.6638C6.8504 20.9075 7.23084 21.0272 7.61479 20.9981C7.99875 20.969 8.35682 20.7934 8.61486 20.5076C8.8729 20.2218 9.01116 19.8477 9.00099 19.4628C8.99083 19.0779 8.83303 18.7116 8.56026 18.4398L7.12026 16.9998H19.4993L19.6433 16.9928C20.0267 16.9556 20.3811 16.7724 20.6331 16.481C20.8851 16.1896 21.0153 15.8125 20.9968 15.4277C20.9783 15.043 20.8124 14.6801 20.5336 14.4142Z"  fill="currentColor"/></svg>',
    limitarÀsPermissões: 'CadastroTransferencia.listar',
    prefixoParaFilhas: 'TransferenciasVoluntarias',
    entidadeMãe: 'TransferenciasVoluntarias',
  },
  children: [
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
        rotasParaMigalhasDePão: [
          'TransferenciasVoluntariasListar',
        ],
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
      children: [
        {
          props: ({ params }) => ({
            ...params,
            ...{
              transferenciaId:
            Number.parseInt(params.transferenciaId, 10) || undefined,
            },
          }),
          name: 'TransferenciaDistribuicaoDeRecursosEditarLista',
          path: '',
          component: TransferenciaDistribuicaoDeRecursosCriarEditarForm, // Dev - teste
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
    {
      name: 'TransferenciasVoluntariasDetalhes',
      path: ':transferenciaId/detalhes',
      component: TransferenciasVoluntariasDetalhes,
      props: ({ params }) => ({
        ...params,
        ...{
          transferenciaId:
            Number.parseInt(params.transferenciaId, 10) || undefined,
        },
      }),
      meta: {
        título: () => (useTransferenciasVoluntariasStore()?.emFoco?.identificador
          ? `Resumo da transferência ${
            useTransferenciasVoluntariasStore()?.emFoco?.identificador
          }`
          : 'Resumo de transferência'),
        rotasParaMenuSecundário,
        rotasParaMigalhasDePão: ['TransferenciasVoluntariasListar'],
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
    /* TRANSFERÊNCIA - IDENTIFICAÇÃO */
    {
      path: ':transferenciaId',
      name: 'TransferenciasVoluntariaEditar',
      component: TransferenciasVoluntariasCriarEditar,
      props: ({ params }) => ({
        ...params,
        ...{
          transferenciaId:
            Number.parseInt(params.transferenciaId, 10) || undefined,
        },
      }),
      meta: {
        título: 'Identificação',
        rotasParaMenuSecundário,
        limitarÀsPermissões: 'CadastroTransferencia.editar',
        rotasParaMigalhasDePão: [
          'TransferenciasVoluntariasListar',
          'TransferenciasVoluntariasDetalhes',
        ],
      },
    },
    /* FIM DE TRANSFERÊNCIA - IDENTIFICAÇÃO */
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
            título: 'Novo documento da transferencia voluntária',
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
            título: 'Editar documento da transferencia',
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
          name: 'TransferenciasVoluntariasTarefasCriar',
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
                transferenciaId: Number.parseInt(params.transferenciaId, 10) || undefined,
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
              name: 'TransferenciasVoluntariasTarefasEditar',
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
              name: 'TransferenciasVoluntariasTarefasProgresso',
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
                    rotaDeEscape: 'TransferenciasVoluntariasTarefasProgresso',
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

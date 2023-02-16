import MenuSecundário from '@/components/MenuSecundario.vue';
import ProjetosAcompanhamento from '@/views/projetos/ProjetosAcompanhamento.vue';
import ProjetosCriarEditar from '@/views/projetos/ProjetosCriarEditar.vue';
import ProjetosCronograma from '@/views/projetos/ProjetosCronograma.vue';
import ProjetosDocumentos from '@/views/projetos/ProjetosDocumentos.vue';
import ProjetosLiçõesAprendidas from '@/views/projetos/ProjetosLicoesAprendidas.vue';
import ProjetosLista from '@/views/projetos/ProjetosLista.vue';
import ProjetosProcessos from '@/views/projetos/ProjetosProcessos.vue';
import ProjetosRaiz from '@/views/projetos/ProjetosRaiz.vue';
import ProjetosResumo from '@/views/projetos/ProjetosResumo.vue';

export default {
  path: '/projetos',
  component: ProjetosRaiz,
  props: {
    submenu: MenuSecundário,
  },

  meta: {
    requerAutenticação: true,

    presenteNoMenu: true,
    títuloParaMenu: 'Projetos',
    íconeParaMenu: `<svg width="18" height="20" viewBox="0 0 18 20" fill="none">
<path d="M16.9948 0.00629546H0.999714C0.734573 0.00629546 0.480291 0.111637 0.292809 0.299119C0.105326 0.486602 0 0.740869 0 1.00601V19.0003C0.0225224 19.2579 0.135082 19.4993 0.31791 19.6821C0.500737 19.8649 0.74214 19.9775 0.999714 20H16.9948C17.26 20 17.5143 19.8947 17.7018 19.7072C17.8892 19.5197 17.9946 19.2654 17.9946 19.0003V1.00601C18.0106 0.870853 17.9958 0.733824 17.9513 0.605215C17.9067 0.476606 17.8336 0.359789 17.7373 0.263546C17.6411 0.167303 17.5243 0.0941436 17.3957 0.0495875C17.267 0.00503137 17.13 -0.00978041 16.9948 0.00629546ZM1.99943 2.00572H3.99886V18.0006H1.99943V2.00572ZM15.9951 18.0006H5.99828V2.00572H8.99714V8.99742L11.4964 6.998L13.9957 8.99742V2.00572H15.9951V18.0006Z" />
</svg>`,
    restringirÀsPermissões: [
      'Projeto.administrador',
      'SMAE.gestor_de_projeto',
      'SMAE.colaborador_de_projeto',
    ],
    rotasParaMenuSecundário: [
      'projetosListar',
      'projetosListarPrioritários',
      'projetosListarArquivados',
      'projetosCriar',
    ],
  },
  children: [
    {
      name: 'projetosListar',
      path: '',
      component: ProjetosLista,
      meta: {
        título: 'Projetos',
        títuloParaMenu: 'Projetos',
      },
      props: ({ params, query }) => ({
        ...params,
        status: query.status?.replace('_', '').toLowerCase(),
      }),
    },

    {
      name: 'projetosListarPrioritários',
      path: 'prioritarios',
      component: ProjetosLista,
      meta: {
        título: 'Projetos prioritários',
        títuloParaMenu: 'Projetos prioritários',
      },
      props: ({ params, query }) => ({
        ...params,
        status: query.status?.replace('_', '').toLowerCase(),
        ...{ apenasPrioritários: true },
      }),
    },

    {
      name: 'projetosListarArquivados',
      path: 'arquivados',
      component: ProjetosLista,
      meta: {
        título: 'Projetos arquivados',
        títuloParaMenu: 'Projetos arquivados',
      },
      props: ({ params, query }) => ({
        ...params,
        status: query.status?.replace('_', '').toLowerCase(),
        ...{ apenasArquivados: true },
      }),
    },

    {
      name: 'projetosCriar',
      path: 'novo',
      component: ProjetosCriarEditar,
      meta: {
        título: 'Novo projeto',
        títuloParaMenu: 'Novo projeto',
      },
    },

    {
      path: ':projetoId',
      meta: {
        rotasParaMenuSecundário: [
          'projetosEditar',
          'projetosResumo',
          'projetosCronograma',
          'projetosAcompanhamento',
          'projetosLiçõesAprendidas',
          'projetosDocumentos',
          'projetosProcessos',
        ],
      },

      children: [
        {
          path: '',
          name: 'projetosEditar',
          component: ProjetosCriarEditar,
          props: ({ params }) => ({
            ...params,
            ...{ projetoId: Number.parseInt(params.projetoId, 10) || undefined },
          }),
          meta: {
            título: 'Editar projeto',
            títuloParaMenu: 'Editar projeto',
          },
        },

        {
          path: 'resumo',
          name: 'projetosResumo',
          component: ProjetosResumo,
          props: ({ params }) => ({
            ...params,
            ...{ projetoId: Number.parseInt(params.projetoId, 10) || undefined },
          }),
          meta: {
            título: 'Resumo de projeto',
            títuloParaMenu: 'Resumo de projeto',
          },
        },

        {
          path: 'cronograma',
          name: 'projetosCronograma',
          component: ProjetosCronograma,
          props: ({ params }) => ({
            ...params,
            ...{ projetoId: Number.parseInt(params.projetoId, 10) || undefined },
          }),
          meta: {
            título: 'Cronograma de projeto',
            títuloParaMenu: 'Cronograma de projeto',
          },
        },

        {
          path: 'acompanhamento',
          name: 'projetosAcompanhamento',
          component: ProjetosAcompanhamento,
          props: ({ params }) => ({
            ...params,
            ...{ projetoId: Number.parseInt(params.projetoId, 10) || undefined },
          }),
          meta: {
            título: 'Acompanhamento de projeto',
            títuloParaMenu: 'Acompanhamento de projeto',
          },
        },

        {
          path: 'licoes-aprendidas',
          name: 'projetosLiçõesAprendidas',
          component: ProjetosLiçõesAprendidas,
          props: ({ params }) => ({
            ...params,
            ...{ projetoId: Number.parseInt(params.projetoId, 10) || undefined },
          }),
          meta: {
            título: 'Lições aprendidas no projeto',
            títuloParaMenu: 'Lições aprendidas no projeto',
          },
        },

        {
          path: 'documentos',
          name: 'projetosDocumentos',
          component: ProjetosDocumentos,
          props: ({ params }) => ({
            ...params,
            ...{ projetoId: Number.parseInt(params.projetoId, 10) || undefined },
          }),
          meta: {
            título: 'Documentos do projeto',
            títuloParaMenu: 'Documentos do projeto',
          },
        },

        {
          path: 'processos',
          name: 'projetosProcessos',
          component: ProjetosProcessos,
          props: ({ params }) => ({
            ...params,
            ...{ projetoId: Number.parseInt(params.projetoId, 10) || undefined },
          }),
          meta: {
            título: 'Processos SEI do projeto',
            títuloParaMenu: 'Processos SEI do projeto',
          },
        },
      ],
    },
  ],
};

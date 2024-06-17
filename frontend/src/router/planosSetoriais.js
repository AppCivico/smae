import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';

export default {
  path: '/planos-setoriais',
  component: () => import('@/views/planosSetoriais/PlanosSetoriaisRaiz.vue'),

  meta: {
    título: 'Planos setoriais',
    íconeParaMenu: `<svg width="18" height="20" viewBox="0 0 18 20" fill="currentColor">
<path d="M16.9948 0.00629546H0.999714C0.734573 0.00629546 0.480291 0.111637 0.292809 0.299119C0.105326 0.486602 0 0.740869 0 1.00601V19.0003C0.0225224 19.2579 0.135082 19.4993 0.31791 19.6821C0.500737 19.8649 0.74214 19.9775 0.999714 20H16.9948C17.26 20 17.5143 19.8947 17.7018 19.7072C17.8892 19.5197 17.9946 19.2654 17.9946 19.0003V1.00601C18.0106 0.870853 17.9958 0.733824 17.9513 0.605215C17.9067 0.476606 17.8336 0.359789 17.7373 0.263546C17.6411 0.167303 17.5243 0.0941436 17.3957 0.0495875C17.267 0.00503137 17.13 -0.00978041 16.9948 0.00629546ZM1.99943 2.00572H3.99886V18.0006H1.99943V2.00572ZM15.9951 18.0006H5.99828V2.00572H8.99714V8.99742L11.4964 6.998L13.9957 8.99742V2.00572H15.9951V18.0006Z" />
</svg>`,
    rotaPrescindeDeChave: true,
    limitarÀsPermissões: [
      'PS.',
    ],
  },
  children: [
    {
      name: 'planosSetoriaisListar',
      path: '',
      component: () => import('@/views/planosSetoriais/PlanosSetoriaisLista.vue'),
    },
    {
      name: 'planosSetoriaisCriar',
      path: 'novo',
      component: () => import('@/views/planosSetoriais/PlanosSetoriaisCriarEditar.vue'),
      meta: {
        limitarÀsPermissões: [
          'CadastroPS.administrador',
          'CadastroPS.administrador_no_orgao',
        ],
        rotaDeEscape: 'planosSetoriaisResumo',
        rotasParaMigalhasDePão: [
          'planosSetoriaisListar',
        ],
        título: 'Cadastro de Plano Setorial',
      },
    },
    {
      path: ':planoSetorialId',
      props: ({ params }) => ({
        ...params,
        planoSetorialId: Number.parseInt(params.planoSetorialId, 10) || undefined,
      }),
      meta: {
        rotasParaMenuSecundário: [
          'planosSetoriaisResumo',
          'planosSetoriaisDocumentos',
        ],
        rotasParaMigalhasDePão: [
          'planosSetoriaisListar',
        ],
      },
      component: () => import('@/views/planosSetoriais/PlanosSetoriaisItem.vue'),
      children: [
        {
          path: '',
          name: 'planosSetoriaisEditar',
          component: () => import('@/views/planosSetoriais/PlanosSetoriaisCriarEditar.vue'),
          props: ({ params }) => ({
            ...params,
            planoSetorialId: Number.parseInt(params.planoSetorialId, 10) || undefined,
          }),
          meta: {
            limitarÀsPermissões: [
              'CadastroPS.administrador',
              'CadastroPS.administrador_no_orgao',
            ],
            rotaDeEscape: 'planosSetoriaisResumo',
            título: () => usePlanosSetoriaisStore()?.emFoco?.nome || 'Editar Plano Setorial',
          },
        },
        {
          path: 'resumo',
          name: 'planosSetoriaisResumo',
          component: () => import('@/views/planosSetoriais/PlanosSetoriaisResumo.vue'),
          props: ({ params }) => ({
            ...params,
            planoSetorialId: Number.parseInt(params.planoSetorialId, 10) || undefined,
          }),
          meta: {
            título: () => usePlanosSetoriaisStore()?.emFoco?.nome || 'Resumo de Plano Setorial',
            títuloParaMenu: 'Resumo',
          },
        },
        {
          path: 'documentos',
          name: 'planosSetoriaisDocumentos',
          component: () => import('@/views/planosSetoriais/PlanosSetoriaisDocumentos.vue'),
          props: ({ params }) => ({
            ...params,
            planoSetorialId: Number.parseInt(params.planoSetorialId, 10) || undefined,
          }),
          meta: {
            título: () => usePlanosSetoriaisStore()?.emFoco?.nome || 'Documentos de Plano Setorial',
            títuloParaMenu: 'Documentos',
          },
        },
      ],
    },
  ],
};

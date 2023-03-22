import { useLiçõesAprendidasStore } from '@/stores/licoesAprendidas.store.ts';
import liçõesAprendidasCriarEditar from '@/views/licoesAprendidas/LicoesAprendidasCriarEditar.vue';
import liçõesAprendidasItem from '@/views/licoesAprendidas/LicoesAprendidasItem.vue';
import liçõesAprendidasLista from '@/views/licoesAprendidas/LicoesAprendidasLista.vue';
import liçõesAprendidasRaiz from '@/views/licoesAprendidas/LicoesAprendidasRaiz.vue';

export default {
  path: 'licoes-aprendidas',
  component: liçõesAprendidasRaiz,

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
  }),

  meta: {
    requerAutenticação: true,

  },
  children: [
    {
      name: 'liçõesAprendidasListar',
      path: '',
      component: liçõesAprendidasLista,
      meta: {
        título: 'Lições aprendidas com o projeto',
        títuloParaMenu: 'Lições aprendidas',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'liçõesAprendidasListar',
        ],
      },
      props: true,
    },

    {
      name: 'liçõesAprendidasCriar',
      path: 'nova',
      component: liçõesAprendidasCriarEditar,
      meta: {
        título: 'Nova lição',
        títuloParaMenu: 'Nova lição',

        rotaDeEscape: 'liçõesAprendidasListar',

        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
          'liçõesAprendidasListar',
          'liçõesAprendidasCriar',
        ],
      },
    },

    {
      path: ':licaoAprendidaId',
      component: liçõesAprendidasItem,
      props: ({ params }) => ({
        ...params,
        projetoId: Number.parseInt(params.projetoId, 10) || undefined,
        licaoAprendidaId: Number.parseInt(params.licaoAprendidaId, 10) || undefined,
      }),

      children: [
        {
          path: '',
          name: 'liçõesAprendidasEditar',
          component: liçõesAprendidasCriarEditar,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            licaoAprendidaId: Number.parseInt(params.licaoAprendidaId, 10) || undefined,
          }),

          meta: {
            título: () => useLiçõesAprendidasStore()?.emFoco?.descricao || 'Editar lição',
            títuloParaMenu: 'Editar lição',

            rotaDeEscape: 'liçõesAprendidasListar',

            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'liçõesAprendidasListar',
              'liçõesAprendidasEditar',
            ],
          },
        },
      ],
    },
  ],
};

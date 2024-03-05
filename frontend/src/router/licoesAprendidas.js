import { useLiçõesAprendidasStore } from '@/stores/licoesAprendidas.store.ts';
import liçõesAprendidasCriarEditar from '@/views/licoesAprendidas/LicoesAprendidasCriarEditar.vue';
import liçõesAprendidasItem from '@/views/licoesAprendidas/LicoesAprendidasItem.vue';
import liçõesAprendidasLista from '@/views/licoesAprendidas/LicoesAprendidasLista.vue';
import liçõesAprendidasRaiz from '@/views/licoesAprendidas/LicoesAprendidasRaiz.vue';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import dateToField from '@/helpers/dateToField';
import LoadingComponent from '@/components/LoadingComponent.vue';
import { defineAsyncComponent } from 'vue';

const licoesAprendidasResumo = defineAsyncComponent({
  loader: () => import('@/views/licoesAprendidas/LicoesAprendidasResumo.vue'),
  loadingComponent: LoadingComponent,
});

export default {
  path: 'licoes-aprendidas',
  component: liçõesAprendidasRaiz,

  props: ({ params }) => ({
    ...params,
    projetoId: Number.parseInt(params.projetoId, 10) || undefined,
  }),

  meta: {
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

        {
          path: 'resumo',
          name: 'liçõesAprendidasResumo',
          component: licoesAprendidasResumo,
          props: ({ params }) => ({
            ...params,
            projetoId: Number.parseInt(params.projetoId, 10) || undefined,
            licaoAprendidaId: Number.parseInt(params.licaoAprendidaId, 10) || undefined,
          }),
          meta: {
            título: () => {
              let título = useLiçõesAprendidasStore()?.emFoco?.data_registro
                ? `Acompanhamento ${dateToField(useLiçõesAprendidasStore()?.emFoco?.data_registro)}`
                : 'Resumo de lição aprendida';

              if (useProjetosStore()?.emFoco?.nome) {
                título = `${título} do projeto ${useProjetosStore()?.emFoco?.nome}`;
              }

              return título;
            },
            títuloParaMenu: 'Resumo',
          },
        },
      ],
    },
  ],
};

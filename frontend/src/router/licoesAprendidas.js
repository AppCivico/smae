import LoadingComponent from '@/components/LoadingComponent.vue';
import dateToField from '@/helpers/dateToField';
import { useLiçõesAprendidasStore } from '@/stores/licoesAprendidas.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import liçõesAprendidasCriarEditar from '@/views/licoesAprendidas/LicoesAprendidasCriarEditar.vue';
import liçõesAprendidasItem from '@/views/licoesAprendidas/LicoesAprendidasItem.vue';
import liçõesAprendidasLista from '@/views/licoesAprendidas/LicoesAprendidasLista.vue';
import liçõesAprendidasRaiz from '@/views/licoesAprendidas/LicoesAprendidasRaiz.vue';
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
    título: 'Lições aprendidas',
  },
  children: [
    {
      name: 'liçõesAprendidasListar',
      path: '',
      component: liçõesAprendidasLista,
      meta: {
        títuloParaMenu: 'Lições aprendidas',
        rotasParaMigalhasDePão: [
          'projetosListar',
          'projetosResumo',
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
            // título: ' ',
            rotaDeEscape: 'liçõesAprendidasListar',
            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
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
            rotasParaMigalhasDePão: [
              'projetosListar',
              'projetosResumo',
              'liçõesAprendidasListar',
            ],
          },
        },
      ],
    },
  ],
};

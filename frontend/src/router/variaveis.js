import { useVariaveisGlobaisStore } from '@/stores/variaveisGlobais.store.ts';

export default {
  path: '/variaveis',
  component: () => import('@/views/variaveis/VariaveisRaiz.vue'),

  meta: {
    título: 'Banco de Variáveis',
    íconeParaMenu: `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="18" fill="none" viewBox="0 0 25 18">
  <g stroke="#F7C234" stroke-linecap="round" stroke-miterlimit="10" stroke-width="1.5" clip-path="url(#a)">
    <path d="M5.105 5.172V.648h13.687v4.524M8.411 5.43H2.193C1.347 5.43.66 6.12.66 6.97c0 .852.687 1.542 1.533 1.542h6.218c.847 0 1.533-.69 1.533-1.541S9.258 5.43 8.411 5.43Zm-.019 4.343H2.174c-.847 0-1.533.69-1.533 1.541s.686 1.541 1.533 1.541h6.218c.846 0 1.533-.69 1.533-1.54 0-.852-.687-1.542-1.533-1.542ZM8.57 9.6V8.426M1.918 9.944V8.77m6.474 5.171H2.174c-.847 0-1.533.69-1.533 1.541 0 .852.686 1.541 1.533 1.541h6.218c.846 0 1.533-.69 1.533-1.54 0-.852-.687-1.542-1.533-1.542Zm.178-.171v-.872m-6.652 1.218V12.94m16.804-5.145c3.041 0 5.507-.576 5.507-1.286 0-.71-2.466-1.286-5.507-1.286-3.042 0-5.507.576-5.507 1.286 0 .71 2.465 1.286 5.507 1.286Z"/>
    <path d="M13.328 6.768v9.28s5.576 3.022 10.946-.146v-9.28m-11.059 4.28.111.147"/>
    <path d="M13.266 10.04s4.23 2.546 10.962 0m-10.833 3.073s4.23 2.547 10.962 0"/>
  </g>
  <defs>
    <clipPath id="a">
      <path fill="#fff" d="M0 0h25v18H0z"/>
    </clipPath>
  </defs>
</svg>`,
    rotaPrescindeDeChave: true,
    presenteNoMenu: true,
    pesoNoMenu: 3,
    limitarÀsPermissões: [
      'CadastroIndicadorPS.editar',
      'CadastroIndicadorPS.inserir',
      'CadastroMetaPS.listar',
    ],
  },
  children: [
    {
      name: 'variaveisListar',
      path: '',
      component: () => import('@/views/variaveis/VariaveisLista.vue'),
    },
    {
      component: () => import('@/views/variaveis/VariaveisCriarEditar.vue'),
      path: 'novo',
      name: 'variaveisCriar',
      meta: {
        limitarÀsPermissões: [
          'CadastroIndicadorPS.inserir',
        ],
        rotaDeEscape: 'variaveisListar',
        rotasParaMigalhasDePão: [
          'variaveisListar',
        ],
        título: 'Cadastro de Variável',
      },
    },
    {
      component: () => import('@/views/variaveis/VariaveisItem.vue'),
      path: ':variavelId',
      props: ({ params }) => ({
        ...params,
        variavelId: Number.parseInt(params.variavelId, 10) || undefined,
      }),
      meta: {
        rotasParaMenuSecundário: [
          // 'variaveisResumo',
        ],
        rotasParaMigalhasDePão: [
          'variaveisListar',
        ],
      },
      children: [
        {
          component: () => import('@/views/variaveis/VariaveisCriarEditar.vue'),
          name: 'variaveisEditar',
          path: '',
          props: ({ params }) => ({
            ...params,
            variavelId: Number.parseInt(params.variavelId, 10) || undefined,
          }),
          meta: {
            limitarÀsPermissões: [
              'CadastroIndicadorPS.inserir',
            ],
            rotaDeEscape: 'variaveisListar',
            título: 'Editar Variável',
          },
        },
      ],
    },
  ],
};

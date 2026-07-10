import { useContratosStore } from '@/stores/contratos.store';
import ContratosCriarEditar from '@/views/mdo.contratos/ContratosCriarEditar.vue';

export default function obrasContratos(entidadeMãe) {
  function obterContratoEmFoco() {
    return useContratosStore(entidadeMãe).emFoco;
  }

  return {
    path: 'contratos',
    component: () => import('@/views/mdo.contratos/ContratosRaiz.vue'),
    props: true,
    children: [
      {
        name: 'contratosDaObraListar',
        path: '',
        component: () => import('@/views/mdo.contratos/ContratosLista.vue'),
        meta: {
          título: 'Contratos da obra',
          títuloParaMenu: 'Contratos',
          rotasParaMigalhasDePão: [
            'obrasListar',
            'obrasResumo',
          ],
        },
        props: true,
      },

      {
        name: 'contratosDaObraCriar',
        path: 'novo',
        component: ContratosCriarEditar,
        meta: {
          título: 'Novo contrato',

          rotaDeEscape: 'contratosDaObraListar',

          rotasParaMigalhasDePão: [
            'obrasListar',
            'obrasResumo',
            'contratosDaObraListar',
          ],
        },
      },

      {
        path: ':contratoId',
        component: () => import('@/views/mdo.contratos/ContratosItem.vue'),
        props: true,
        children: [
          {
            path: '',
            name: 'contratosDaObraEditar',
            component: ContratosCriarEditar,
            props: true,

            meta: {
              títuloParaMenu: 'Editar contrato',
              título: () => obterContratoEmFoco()?.numero || 'Editar contrato',
              rotaDeEscape: 'contratosDaObraListar',
              rotasParaMigalhasDePão: [
                'obrasListar',
                'obrasResumo',
                'contratosDaObraListar',
                'contratosDaObraResumo',
              ],
            },
          },

          {
            path: 'resumo',
            name: 'contratosDaObraResumo',
            component: () => import('@/views/mdo.contratos/ContratosResumo.vue'),
            props: true,
            meta: {
              tituloParaMigalhaDePao: () => obterContratoEmFoco()?.numero || 'Resumo de contrato',
              título: () => obterContratoEmFoco()?.numero || 'Resumo de contrato',
              títuloParaMenu: 'Resumo',
              rotasParaMigalhasDePão: [
                'obrasListar',
                'obrasResumo',
                'contratosDaObraListar',
              ],
            },
          },
        ],
      },
    ],
  };
}

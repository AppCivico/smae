import { useContratosStore } from '@/stores/contratos.store';
import ContratosCriarEditar from '@/views/mdo.contratos/ContratosCriarEditar.vue';

export default function obrasContratos(entidadeMãe) {
  function obterContratoEmFoco() {
    const { emFoco } = useContratosStore(entidadeMãe);

    return emFoco;
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
              título: () => {
                const emFoco = obterContratoEmFoco();

                if (!emFoco?.numero) {
                  return 'Editar contrato';
                }

                return `Editar contrato ${emFoco.numero}`;
              },
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
              tituloParaMigalhaDePao: () => {
                const emFoco = obterContratoEmFoco();

                if (!emFoco?.numero) {
                  return 'Contrato';
                }

                return emFoco.numero;
              },
              título: () => {
                const emFoco = obterContratoEmFoco();

                return emFoco?.numero
                  ? `Resumo do contrato ${emFoco.numero}`
                  : 'Resumo de contrato';
              },
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

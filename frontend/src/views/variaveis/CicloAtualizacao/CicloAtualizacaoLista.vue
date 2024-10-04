<template>
  <section class="ciclo-atualizacao-lista">
    <header class="flex spacebetween center mb2 g2">
      <TítuloDePágina id="titulo-da-pagina" />

      <hr class="f1">
    </header>

    <CicloAtualizacaoListaFiltro
      v-if="temEquipes"
      class="mb3"
    />

    <div class="flex spacebetween">
      <EnvelopeDeAbas
        :meta-dados-por-id="tabs"
        alinhamento="esquerda"
        class="ciclo-atualizacao-lista__abas"
      >
        <template
          v-for="(tab, tabIndex) in tabs"
          #[tabIndex]
          :key="tab.id"
        />
      </EnvelopeDeAbas>

      <div class="ciclo-atualizacao-lista__icones-opcoes flex g05">
        <h6
          v-for="(iconData, iconIndex) in icons"
          :key="`ciclo-atualizacao-icon--${iconIndex}`"
          class="ciclo-atualizacao-lista__icones-opcoes-item flex center"
        >
          <svg
            width="20"
            height="20"
          ><use :xlink:href="`#${iconData.icone}`" /></svg>
          {{ iconData.label }}
        </h6>
      </div>
    </div>

    <table class="ciclo-atualizacao-lista__listagem">
      <thead>
        <tr>
          <th scope="col">
            CÓDIGO/NOME
          </th>

          <th scope="col">
            Referência
          </th>

          <th scope="col">
            equipes repsonsáveis
          </th>
          <th scope="col">
            prazo
          </th>

          <th scope="col" />
        </tr>
      </thead>

      <tbody
        v-for="cicloAtualizacao in ciclosAtualizacao"
        :key="`ciclo-atualizacao--${cicloAtualizacao.id}`"
        class="listagem-item"
      >
        <tr>
          <th
            scope="row"
            class="flex center g05"
          >
            <!--  -->
            <div class="listagem-item__icone">
              <svg
                :width="cicloAtualizacao.icone.tamanho"
                :height="cicloAtualizacao.icone.tamanho"
              ><use :xlink:href="`#${cicloAtualizacao.icone.icone}`" /></svg>
            </div>

            <h5 class="listagem-item__conteudo f1">
              <strong
                :class="{'tvermelho tipinfo like-a__text': cicloAtualizacao.temAtraso}"
              >
                {{ cicloAtualizacao.codigo }}
                <div v-if="cicloAtualizacao.temAtraso">
                  Atualização com atraso: {{ cicloAtualizacao.atrasos?.length }}
                </div>
              </strong> -
              {{ truncate(cicloAtualizacao.titulo, 60) }}
            </h5>
          </th>

          <td>
            <span :class="{'tvermelho tipinfo like-a__text': cicloAtualizacao.temAtraso}">
              {{ dateIgnorarTimezone(cicloAtualizacao.ultimo_periodo_valido, 'MM/yyyy') }}
            </span>
          </td>

          <td>
            {{ cicloAtualizacao.equipes.map(i => i.titulo).join(", ") }}
          </td>

          <td>
            {{ dateIgnorarTimezone(cicloAtualizacao.prazo, 'dd/MM/yyyy') }}
          </td>

          <th>
            <SmaeLink
              v-if="cicloAtualizacao.pode_editar"
              type="button"
              class="tipinfo tprimary like-a__text"
              exibir-desabilitado
              :to="{
                name: 'cicloAtualizacao.editar',
                params: {
                  cicloAtualizacaoId: cicloAtualizacao.id,
                  dataReferencia: cicloAtualizacao.ultimo_periodo_valido
                }
              }"
            >
              <svg
                width="20"
                height="20"
              ><use xlink:href="#i_edit" /></svg>
              <div>Editar</div>
            </SmaeLink>
          </th>
        </tr>
      </tbody>

      <tbody
        v-if="ciclosAtualizacao.length === 0"
        class="listagem-item listagem-item--sem-resultado"
      >
        <tr>
          <td colspan="5">
            Sem items a exibir
          </td>
        </tr>
      </tbody>
    </table>
  </section>

  <router-view />
</template>

<script lang="ts" setup>
import { useRoute } from 'vue-router';

import { watch, computed, onMounted } from 'vue';
import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';

import { useEquipesStore } from '@/stores/equipes.store';
import { useCicloAtualizacaoStore, VariavelCiclo } from '@/stores/cicloAtualizacao.store';

import truncate from '@/helpers/truncate';
import SmaeLink from '@/components/SmaeLink.vue';

import CicloAtualizacaoListaFiltro from './partials/CicloAtualizacaoLista/CicloAtualizacaoListaFiltro.vue';
import dateIgnorarTimezone from '@/helpers/dateIgnorarTimezone';

type IconOpcoes = 'complementacao' | 'coleta';

type IconForma = {
  icone: string;
  tamanho: number;
  label: string
};

type IconsMap = {
  [key in IconOpcoes]: IconForma
};

type VariavelCicloComIcone = VariavelCiclo & {
  icone: IconForma
  temAtraso: boolean
};

const equipesStore = useEquipesStore();
const cicloAtualizacaoStore = useCicloAtualizacaoStore();

const temEquipes = computed<boolean>(() => equipesStore.lista.length > 0);

const $route = useRoute();

const tabs = {
  coleta: {
    aberta: true,
    etiqueta: 'Coleta',
    id: 'Preenchimento',
    aba: 'coleta',
  },
  aprovacao: {
    etiqueta: 'Aprovação',
    id: 'Validacao',
    aba: 'aprovacao',
  },
  liberacao: {
    etiqueta: 'Liberação',
    id: 'Liberacao',
    aba: 'liberacao',
  },
};

const icons: IconsMap = {
  coleta: {
    tamanho: 12,
    icone: 'i_circle',
    label: 'Coleta',
  },
  complementacao: {
    tamanho: 15,
    icone: 'i_alert',
    label: 'Complementação',
  },
};

function getIcons(reference: IconOpcoes): IconForma {
  return icons[reference] || icons.coleta;
}

const ciclosAtualizacao = computed(() => {
  const ciclosComIcone = cicloAtualizacaoStore.ciclosAtualizacao.map<VariavelCicloComIcone>(
    (item) => ({
      ...item,
      temAtraso: !!(item.atrasos && item.atrasos.length !== 0),
      icone: getIcons(item.pedido_complementacao ? 'complementacao' : 'coleta'),
    }),
  );

  return ciclosComIcone;
});

function formatarReferencia(referencia: any): string | undefined {
  if (!referencia) return undefined;

  return `${referencia.split('/').reverse().join('-')}-01`;
}

// function abreEdicaoOrcamento({ id, referencia }) {
//   editModalStore.modal(CicloAtualizacaoModal, {
//     id,
//     referencia,
//     checkClose: () => {
//       alertStore.confirmAction('Deseja sair sem salvar as alterações?', () => {
//         editModalStore.clear();
//         alertStore.clear();
//       });
//     },
//   }, 'small');
// }

watch(() => $route.query, (query) => {
  const { aba, ...params } = query;

  if (Object.keys(query).length === 0) {
    return;
  }

  cicloAtualizacaoStore.getCiclosAtualizacao({
    ...params,
    referencia: formatarReferencia(params.referencia),
    fase: aba,
  });
}, { immediate: true });

onMounted(() => {
  if (!temEquipes.value) {
    equipesStore.buscarTudo();
  }
});
</script>

<style lang="less" scoped>
.ciclo-atualizacao-lista__abas {
  :deep(.abas__navegação) {
    margin: 0 !important;
  }
}

.ciclo-atualizacao-lista__listagem {
  margin-top: 19px;
  width: 100%;
  overflow-x: auto;
  min-width: 1010px;

  thead {
    th {
      font-size: 12px;
      font-weight: 700;
      line-height: 15px;
      color: #B8C0CC;
      text-transform: uppercase;
    }
  }

  tr {
    > * {
      border: 5px solid transparent;
      border-left: 0;
      border-right: 0;
      text-align: left;

      padding-left: 2rem;

      &:first-child {
        padding-left: 12px;
      }

      &:last-child {
        padding-right: 12px;
      }
    }
  }
}

.listagem-item {
  border-left: 0;
  border-right: 0;
  border: 1rem solid #fff;

  tr {
    background-color: #F9F9F9;
  }
}

.listagem-item--sem-resultado {
  height: 45px;
}

.listagem-item__conteudo {
  font-size: 12px;
  font-weight: 900;
  line-height: 21px;
  letter-spacing: 0.05em;
  color: #3B5881;
  margin: 0;
}

.ciclo-atualizacao-lista__icones-opcoes-item {
  gap: 3px;
  margin: 0;
  font-size: 11px;
  font-weight: 400;
  line-height: 14px;
  letter-spacing: 0.02em;
}
</style>

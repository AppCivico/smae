<template>
  <section class="comunicados-gerais">
    <div class="comunicados-gerais__header flex spacebetween center mb2">
      <TítuloDePágina />
    </div>

    <ComunicadosGeraisFiltros />

    <EnvelopeDeAbas
      :meta-dados-por-id="tabs"
      alinhamento="esquerda"
    >
      <template #ComunicadosDaSemana />

      <template #Historico />
    </EnvelopeDeAbas>

    <ul class="comunicados-gerais__list">
      <ComunicadoGeralItem
        v-for="item in comunicadosGerais"
        :key="`comunicado-item--${item.id}`"
        :class="`comunicado-item--${item.id}`"
        v-bind="item"
        @update:lido="mudarLido(item, $event)"
      />
    </ul>

    <MenuPaginacao
      class="mt4"
      :paginas="paginacao.paginas"
      :total-registros="paginacao.totalRegistros"
      :tem-mais="paginacao.temMais"
      :token-paginacao="paginacao.tokenProximaPagina"
    />
  </section>
</template>

<script lang="ts" setup>
import { computed, watch } from 'vue';
import { storeToRefs } from 'pinia';

import { useAuthStore } from '@/stores/auth.store';
import { useComunicadosGeraisStore } from '@/stores/comunicadosGerais.store';

import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';

import { useRoute } from 'vue-router';
import MenuPaginacao from '@/components/MenuPaginacao.vue';
import ComunicadoGeralItem from './partials/ComunicadoGeralItem.vue';
import ComunicadosGeraisFiltros from './partials/ComunicadosGeraisFiltros.vue';
import type { IComunicadoGeralItem } from './interfaces/ComunicadoGeralItemInterface';

const authStore = useAuthStore();
const comunicadosGeraisStore = useComunicadosGeraisStore();
const comunicadosGerais = computed(() => comunicadosGeraisStore.comunicadosGerais);
const paginacao = computed(() => comunicadosGeraisStore.paginacao);
const { temPermissãoPara } = storeToRefs(authStore);

const $route = useRoute();

const tabs = {
  ComunicadosDaSemana: {
    aberta: true,
    etiqueta: 'Comunicados da semana',
    id: 'comunicados-da-semana',
    aba: 'comunicados-da-semana',
  },
  Historico: {
    id: 'historico',
    etiqueta: 'Histórico',
    aba: 'historico',
  },
};

async function mudarLido(item: IComunicadoGeralItem, lido: boolean) {
  try {
    await comunicadosGeraisStore.mudarLido(item.id, lido);

    // eslint-disable-next-line no-param-reassign
    item.lido = lido;
  } catch (e) {
    console.error('Erro ao tentar mudar status de leitura do documento');
  }
}

watch(() => $route.query, (query) => {
  comunicadosGeraisStore.getComunicadosGerais({
    ...query,
    lido: $route.query?.aba === tabs.Historico.id ? true : undefined,
  });
}, { immediate: true });

</script>

<style lang="less" scoped>
.comunicados-gerais {}

.comunicados-gerais__list {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 42px 48px;
}
</style>

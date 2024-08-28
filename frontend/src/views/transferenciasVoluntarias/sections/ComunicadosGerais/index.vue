<template>
  <section class="comunicados-gerais">
    <div class="comunicados-gerais__header flex spacebetween center mb2">
      <TítuloDePágina />
    </div>

    <EnvelopeDeAbas
      :meta-dados-por-id="tabs"
      alinhamento="esquerda"
    >
      <template #ComunicadosDaSemana>
        <ul class="comunicados-gerais__list">
          <ComunicadoGeralItem
            v-for="item in items"
            :key="`comunicado-item--${item.id}`"
            v-bind="item"
            @update:lido="handleLido(item, $event)"
          />
        </ul>
      </template>

      <template #Historico>
        <h1>Historico</h1>
      </template>
    </EnvelopeDeAbas>
  </section>
</template>

<script lang="ts" setup>
import { ref } from 'vue';
import { storeToRefs } from 'pinia';

import { useAuthStore } from '@/stores/auth.store';

import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';

import ComunicadoGeralItem from './partials/ComunicadoGeralItem.vue';
import type { IComunicadoGeralItem } from './interfaces/ComunicadoGeralItemInterface.ts';

const authStore = useAuthStore();
const { temPermissãoPara } = storeToRefs(authStore);

const tabs = {
  ComunicadosDaSemana: {
    aberta: true,
    etiqueta: 'Comunicados da semana',
    id: 'comunicados-da-semana',
    aba: 'comunicados-da-semana',
  },
  Historico: {
    id: 'Historico',
    etiqueta: 'Histórico',
    aba: 'Historico',
  },
};

const items = ref<IComunicadoGeralItem[]>([
  {
    id: '1',
    titulo: 'Título do comunicado',
    data: new Date(),
    conteudo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin tempus  dignissim dolor, quis mollis justo cursus quis. Vestibulum consequat,  tortor eu bibendum lobortis, lacus urna semper elit, ac sollicitudin  ligula ante vitae erat. Vestibulum auctor magna sed lacus egestas, sed  porta lectus maximus. Proin non lobortis lacus. Donec laoreet quam sed  est eleifend sollicitudin. Maecenas pulvinar porta hendrerit. Nulla  facilisi. Fusce quis lacinia erat. Sed vel lorem eget felis interdum  tempus in ut elit. Quisque commodo viverra leo, nec iaculis nunc  fringilla et. Praesent luctus vulputate libero, a faucibus lectus  pretium tristique. Mauris pellentesque sollicitudin justo, sed efficitur  turpis convallis ac.',
    lido: false,
  },
  {
    id: '2',
    titulo: 'Título do comunicado geral',
    data: new Date(),
    conteudo: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Proin tempus dignissim dolor, quis mollis justo cursus quis. Vestibulum consequat, tortor eu bibendum lobortis, lacus urna semper elit, ac sollicitudin ligula ante vitae erat. Vestibulum auctor magna sed lacus egestas, sed porta lectus maximus. Proin non lobortis lacus. Donec laoreet quam sed est eleifend sollicitudin. Maecenas pulvinar porta hendrerit. Nulla facilisi.',
    lido: true,
  },
]);

function handleLido(item: IComunicadoGeralItem, lido: boolean) {
  // eslint-disable-next-line no-param-reassign
  item.lido = lido;
}
</script>

<style lang="less" scoped>
.comunicados-gerais {
  &__list {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 42px 48px;
  }
}
</style>

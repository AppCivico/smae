<script setup>
import {
  useOrgansStore, useProjetosStore
} from '@/stores';

import TabelaDeProjetos from '@/components/projetos/TabelaDeProjetos.vue';
import { storeToRefs } from 'pinia';
import { computed } from 'vue';
import { useRoute } from 'vue-router';

const organsStore = useOrgansStore();
const { organs } = storeToRefs(organsStore);
const projetosStore = useProjetosStore();
const {
  lista, chamadasPendentes, erro,
} = storeToRefs(projetosStore);
const route = useRoute();

const props = defineProps({
  apenasPrioritários: {
    type: Boolean,
    default: false,
  },
});

projetosStore.$reset();
if (props?.apenasPrioritários) {
  projetosStore.buscarTudo({ eh_prioritario: true });
} else {
  projetosStore.buscarTudo();
}

if (!organs.length) {
  organsStore.getAll();
}

const listasAgrupadas = computed(() => lista.value?.reduce((acc, cur) => {
  if (!acc[cur.portfolio.id]) {
    acc[cur.portfolio.id] = { ...cur.portfolio, lista: [] };
  }
  acc[cur.portfolio.id].lista.push(cur);
  return acc;
}, {}) || {});

</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ route?.meta?.título || 'Projetos' }}</h1>
    <hr class="ml2 f1">
    <router-link
      :to="{ name: 'projetosCriar' }"
      class="btn big ml1"
    >
      Novo projeto
    </router-link>
  </div>

  <div class="boards">
    <template v-if="Object.keys(listasAgrupadas).length">
      <div class="flex flexwrap g2">
        <div
          v-for="item in Object.keys(listasAgrupadas)"
          :key="item"
          class="board"
        >
          <h2>{{ listasAgrupadas[item].titulo }}</h2>
          <div class="t11 tc300 mb2">
            {{ listasAgrupadas[item].lista.length }}
            <template v-if="listasAgrupadas[item].lista.length === 1">
              projeto
            </template>
            <template v-else>
              projetos
            </template>
          </div>

          <TabelaDeProjetos
            :lista="listasAgrupadas[item].lista"
            :pendente="chamadasPendentes.lista"
            :erro="erro"
          />

          <hr class="mt1 mb1">
          <router-link
            :to="{ name: 'projetosCriar', query: { portfolio_id: listasAgrupadas[item].id } }"
            class="addlink"
          >
            <svg
              width="20"
              height="20"
            ><use xlink:href="#i_+" /></svg> <span>Adicionar projeto</span>
          </router-link>
        </div>
      </div>
    </template>
  </div>
</template>

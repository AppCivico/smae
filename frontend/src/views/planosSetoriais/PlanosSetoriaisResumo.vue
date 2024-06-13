<script setup>
import { usePlanosSetoriaisStore } from '@/stores/planosSetoriais.store.ts';
import { storeToRefs } from 'pinia';

const planosSetoriaisStore = usePlanosSetoriaisStore();

const { emFoco } = storeToRefs(planosSetoriaisStore);
</script>
<template>
  <header class="flex flexwrap spacebetween center mb2 g2">
    <TítuloDePágina />

    <hr class="f1">

    <router-link
      v-if="emFoco?.id && !emFoco?.arquivado && !emFoco?.permissoes?.apenas_leitura"
      :to="{ name: 'planosSetoriaisEditar', params: { palnoSetorialId: emFoco.id } }"
      class="btn big ml2"
    >
      Editar
    </router-link>
  </header>

  <pre class="debug">emFoco: {{ emFoco }}</pre>
</template>

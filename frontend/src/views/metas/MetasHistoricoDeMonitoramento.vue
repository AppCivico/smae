<script setup>
import DetalhamentoDeCiclo from '@/components/monitoramento/DetalhamentoDeCiclo.vue';
import { useCiclosStore } from '@/stores/ciclos.store';
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';
import { defineOptions, watch } from 'vue';

defineOptions({
  inheritAttrs: false,
});

defineProps({
  // manter compatibilidade com a definição anterior de props
  // eslint-disable-next-line vue/prop-name-casing
  meta_id: {
    type: [
      Number,
      String,
    ],
    required: true,
  },
});

const CiclosStore = useCiclosStore();
const {
  Ciclos,
} = storeToRefs(CiclosStore);

const PdMStore = usePdMStore();
const { activePdm } = storeToRefs(PdMStore);

watch(() => activePdm.value.id, (novoValor) => {
  if (novoValor) {
    CiclosStore.getCiclos();
  }
}, { immediate: true });
</script>
<template>
  <header class="flex flexwrap g1">
    <TítuloDePágina />

    <hr class="f1">
  </header>

  <DetalhamentoDeCiclo
    :id="`ciclo--${activePdm?.ciclo_fisico_ativo?.id}`"
    :ciclo-dados="activePdm?.ciclo_fisico_ativo || null"
    :meta-id="$route.params.meta_id"
    :open="!$route.hash || ($route.hash === `#ciclo--${activePdm?.ciclo_fisico_ativo?.id}`
      ? true
      : false)"
  />

  <template v-if="Array.isArray(Ciclos)">
    <DetalhamentoDeCiclo
      v-for="ciclo in Ciclos"
      :id="`ciclo--${ciclo.id}`"
      :key="ciclo.id"
      :ciclo-dados="ciclo"
      :meta-id="$route.params.meta_id"
      :open="$route.hash === `#ciclo--${ciclo.id}`
        ? true
        : false"
    />
  </template>
</template>

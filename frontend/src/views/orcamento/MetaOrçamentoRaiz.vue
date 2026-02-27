<script setup>
import { storeToRefs } from 'pinia';
import {
  computed,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';

import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import { useMetasStore } from '@/stores/metas.store';

const route = useRoute();

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);
const parametrosParaValidacao = computed(() => ({ pdm_id: activePdm.value?.id }));

MetasStore.getPdM();

watch(() => route.params.meta_id, (novoValor) => {
  MetasStore.getChildren(novoValor);
}, { immediate: true });
</script>
<template>
  <MigalhasDeMetas class="mb2" />

  <router-view :parametros-para-validacao="parametrosParaValidacao" />
</template>

<script setup>
import { useMetasStore } from '@/stores/metas.store';
import { storeToRefs } from 'pinia';
import {
  computed,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';

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
  <router-view :parametros-para-validacao="parametrosParaValidacao" />
</template>

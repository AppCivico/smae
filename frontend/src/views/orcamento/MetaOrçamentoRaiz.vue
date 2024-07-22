<script setup>
import { useMetasStore } from '@/stores/metas.store';
import { storeToRefs } from 'pinia';
import {
  computed,
} from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const MetasStore = useMetasStore();
const { activePdm } = storeToRefs(MetasStore);

MetasStore.getPdM();
MetasStore.getChildren(route.params.meta_id);

const parametrosParaValidacao = computed(() => ({ pdm_id: activePdm.value?.id }));
</script>
<template>
  <router-view :parametros-para-validacao="parametrosParaValidacao" />
</template>

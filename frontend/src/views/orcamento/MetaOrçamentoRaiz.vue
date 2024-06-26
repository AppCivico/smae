<script setup>
import { Dashboard } from '@/components';
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
  <Dashboard>
    <router-view :parametros-para-validacao="parametrosParaValidacao" />
  </Dashboard>
</template>

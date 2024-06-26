<script setup>
import { Dashboard } from '@/components';
import { useMetasStore } from '@/stores/metas.store';
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';

const route = useRoute();

const MetasStore = useMetasStore();

MetasStore.getPdM();
MetasStore.getChildren(route.params.meta_id);
</script>
<template>
  <Dashboard>
    <router-view />
  </Dashboard>
</template>

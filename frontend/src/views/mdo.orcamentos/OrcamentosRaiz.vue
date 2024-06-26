<script setup>
import { useObrasStore } from '@/stores/obras.store';
import {
  computed,
} from 'vue';

const obraStore = useObrasStore();

const parametrosParaValidacao = computed(() => ({ portfolio_id: obraStore.emFoco?.portfolio_id }));
</script>
<template>
  <router-view :parametros-para-validacao="parametrosParaValidacao" />
</template>

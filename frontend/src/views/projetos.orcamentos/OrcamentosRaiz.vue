<script setup>
import { useProjetosStore } from '@/stores/projetos.store.ts';
import {
  computed,
} from 'vue';

const ProjetoStore = useProjetosStore();

const parametrosParaValidacao = computed(() => ({
  portfolio_id: ProjetoStore.emFoco?.portfolio_id,
}));
</script>
<template>
  <router-view :parametros-para-validacao="parametrosParaValidacao" />
</template>

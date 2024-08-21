<script setup>
import { useProjetosStore } from '@/stores/projetos.store.ts';
import {
  computed,
} from 'vue';

const ProjetosStore = useProjetosStore();

const parametrosParaValidacao = computed(() => ({
  portfolio_id: ProjetosStore.emFoco?.portfolio_id,
}));
</script>
<template>
  <router-view
    :parametros-para-validacao="parametrosParaValidacao"
    :anos-do-orcamento="ProjetosStore.emFoco?.ano_orcamento || []"
    :parametros-de-consulta="{
      portfolio_id: ProjetosStore.emFoco?.portfolio_id,
      previsao_custo_disponivel: true,
      planejado_disponivel: true,
      execucao_disponivel: true,
    }"
  />

  <LoadingComponent v-if="ProjetosStore.chamadasPendentes.emFoco" />
  <ErrorComponent v-else-if="ProjetosStore.erro" />
</template>

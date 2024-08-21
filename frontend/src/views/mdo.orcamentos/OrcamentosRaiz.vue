<script setup>
import { useObrasStore } from '@/stores/obras.store';
import {
  computed,
} from 'vue';

const obraStore = useObrasStore();

const parametrosParaValidacao = computed(() => ({
  portfolio_id: obraStore.emFoco?.portfolio_id,
}));
</script>
<template>
  <router-view
    :parametros-para-validacao="parametrosParaValidacao"
    :anos-do-orcamento="obraStore.emFoco?.ano_orcamento || []"
    :parametros-de-consulta="{
      portfolio_id: obraStore.emFoco?.portfolio_id,
      previsao_custo_disponivel: true,
      planejado_disponivel: true,
      execucao_disponivel: true,
    }"
  />

  <LoadingComponent v-if="obraStore.chamadasPendentes.emFoco" />
  <ErrorComponent v-else-if="obraStore.erro" />
</template>

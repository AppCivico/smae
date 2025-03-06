<script setup>
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';
import { storeToRefs } from 'pinia';
import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);

const {
  chamadasPendentes,
  erros,
  analiseEmFoco,
} = storeToRefs(monitoramentoDeMetasStore);

watchEffect(() => {
  monitoramentoDeMetasStore
    .buscarAnaliseDoCiclo(route.params.planoSetorialId, route.params.cicloId, {
      meta_id: route.params.meta_id,
    });
});
</script>
<template>
  <MigalhasDePao />

  Analise Qualitativa

  <div class="debug flex flexwrap g2 mb1">
    <pre class="fb100 mb0">chamadasPendentes.analiseEmFoco: {{ chamadasPendentes.analiseEmFoco }}</pre>
    <pre class="fb100 mb0">erros.analiseEmFoco: {{ erros.analiseEmFoco }}</pre>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >analiseEmFoco: {{ analiseEmFoco }}</textarea>
  </div>
</template>

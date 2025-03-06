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
  riscoEmFoco,
} = storeToRefs(monitoramentoDeMetasStore);

watchEffect(() => {
  monitoramentoDeMetasStore
    .buscarRiscoDoCiclo(route.params.planoSetorialId, route.params.cicloId, {
      meta_id: route.params.meta_id,
    });
});
</script>
<template>
  <MigalhasDePao />

  Analise de risco

  <div class="debug flex flexwrap g2 mb1">
    <pre class="fb100 mb0">chamadasPendentes.riscoEmFoco: {{ chamadasPendentes.riscoEmFoco }}</pre>
    <pre class="fb100 mb0">erros.riscoEmFoco: {{ erros.riscoEmFoco }}</pre>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >riscoEmFoco: {{ riscoEmFoco }}</textarea>
  </div>
</template>

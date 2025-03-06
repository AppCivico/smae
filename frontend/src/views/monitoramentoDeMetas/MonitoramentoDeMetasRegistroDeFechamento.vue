<script setup>
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';
import { storeToRefs } from 'pinia';
import { computed, watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);

const {
  chamadasPendentes,
  erros,
  fechamentoEmFoco,
} = storeToRefs(monitoramentoDeMetasStore);

const fechamentoEmFocoParaEdicao = computed(() => ({
  ciclo_fisico_id: route.params.cicloId,
  comentario: fechamentoEmFoco.value?.corrente.fechamentos[0].comentario,
  meta_id: route.params.metaId,
}));

watchEffect(() => {
  monitoramentoDeMetasStore
    .buscarFechamentoDoCiclo(route.params.planoSetorialId, route.params.cicloId, {
      meta_id: route.params.meta_id,
    });
});
</script>
<template>
  <MigalhasDePao />

  Registro de fechamento

  <div class="debug flex flexwrap g2 mb1">
    <pre class="fb100 mb0">chamadasPendentes.fechamentoEmFoco: {{ chamadasPendentes.fechamentoEmFoco }}</pre>
    <pre class="fb100 mb0">erros.fechamentoEmFoco: {{ erros.fechamentoEmFoco }}</pre>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >fechamentoEmFoco: {{ fechamentoEmFoco }}</textarea>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >fechamentoEmFocoParaEdicao: {{ fechamentoEmFocoParaEdicao }}</textarea>
  </div>
</template>

<script setup>
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';
import { storeToRefs } from 'pinia';
import { watchEffect } from 'vue';
import { useRoute } from 'vue-router';

const route = useRoute();

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);

const {
  chamadasPendentes,
  ciclosPorAno,
  ciclosPorId,
  cicloAtivo,
  erros,
  listaDeCiclos,
  ultimaRevisao,
} = storeToRefs(monitoramentoDeMetasStore);

watchEffect(() => {
  monitoramentoDeMetasStore
    .buscarListaDeCiclos(route.params.planoSetorialId, {
      meta_id: route.params.meta_id,
    });
});
</script>
<template>
  <MigalhasDePao />

  Monitoramento de metas

  <div class="debug flex flexwrap g2 mb1">
    <pre class="fb100 mb0">chamadasPendentes.listaDeCiclos: {{ chamadasPendentes.listaDeCiclos }}</pre>
    <pre class="fb100 mb0">erros.listaDeCiclos: {{ erros.listaDeCiclos }}</pre>
    <pre class="fb100 mb0">cicloAtivo: {{ cicloAtivo }}</pre>

    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >ciclosPorId: {{ ciclosPorId }}</textarea>
    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >ciclosPorAno: {{ ciclosPorAno }}</textarea>
    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >ultimaRevisao: {{ ultimaRevisao }}</textarea>
    <textarea
      class="f1"
      readonly
      cols="30"
      rows="30"
    >listaDeCiclos: {{ listaDeCiclos }}</textarea>
  </div>
</template>

<style lang="less" modules>
.titulo-monitoramento {
  display: flex;
  align-items: center;
  gap: 1rem;
  background: linear-gradient(to right, #e3e5e8, #e3e5e8) no-repeat center;
  background-position: center;
  background-size: 100% 1px;
  background-repeat: no-repeat;
}

.titulo-monitoramento:before {
  position: relative;
  right: auto;
  content: '';
  width: 1rem;
  height: 1rem;
  border-radius: 50%;
  background-color: #f7c234;
  box-shadow: 0 0 0 5px #fff, 0 0 0 6px #e3e5e8;
  background-image: none;
}

.titulo-monitoramento__text {
  margin: 0;
  padding: 0 0.5rem 0 0.5rem;
  background-color: #fff;
}
.ciclo-passado {
  display: flex;
  flex-direction: column;
}

.ciclo-passado h2 {
  margin: 0;
}

.ciclos-anterioes details:nth-child(odd) {
  background-color: #f9f9f9;
}

.ciclo-passado summary {
  display: flex;
  gap: 1rem;
  padding: 2rem 1rem;
}

.ciclo-passado summary::before {
  position: relative;
  right: auto;
  filter: grayscale(1);
}
</style>

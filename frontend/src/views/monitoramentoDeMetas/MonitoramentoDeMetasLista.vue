<script setup>
import DetalhamentoDeCiclo from '@/components/monitoramentoDeMetas/DetalhamentoDeCiclo.vue';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import FormularioQueryString from '@/components/FormularioQueryString.vue';
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';
import { storeToRefs } from 'pinia';
import {
  computed,
  ref,
  watch,
} from 'vue';
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
  anoMaisRecente,
} = storeToRefs(monitoramentoDeMetasStore);

const anosDisponiveis = computed(() => monitoramentoDeMetasStore.anosDisponiveis
  .map((ano) => ({ ano, id: ano })));

const anosSelecionados = ref([]);

const listaDeCiclosFiltrados = computed(() => (!anosSelecionados.value.length
  ? listaDeCiclos.value
  : anosSelecionados.value
    .flatMap((ano) => ciclosPorAno.value[ano] || [])));

watch(
  [() => route.params.planoSetorialId, () => route.params.meta_id],
  ([planoSetorialId, metaId]) => {
    monitoramentoDeMetasStore
      .buscarListaDeCiclos(planoSetorialId, {
        meta_id: metaId,
      }).then(() => {
        if (anoMaisRecente.value !== undefined) {
          anosSelecionados.value = [anoMaisRecente.value];
        }
      });
  },
  { immediate: true },
);
</script>
<template>
  <MigalhasDePao />

  <TituloDePagina />

  <!-- eslint-disable -->
  <div class="debug flex flexwrap g2 mb1 hidden" hidden>
    <pre class="fb100 mb0">
      chamadasPendentes.listaDeCiclos: {{ chamadasPendentes.listaDeCiclos }}
    </pre>
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
  <!-- eslint-disable -->

  <div class="flex column g2">
    <LoadingComponent v-if="chamadasPendentes.listaDeCiclos" />

    <template v-else>
      <DetalhamentoDeCiclo
        :id="`ciclo--${cicloAtivo?.id}`"
        :ciclo-atual="true"
        :ciclo="cicloAtivo"
        :meta-id="$route.params.meta_id"
      />
    </template>

    <div
      v-if="listaDeCiclos?.length"
      class="ciclos-anterioes"
    >
      <div class="titulo-monitoramento titulo-monitoramento--passado mb2">
        <h2 class="tc500 t20 titulo-monitoramento__text">
          <span class="w400">
            Ciclos Anteriores
          </span>
        </h2>
      </div>
      <AutocompleteField
        name="anos"
        @change="anosSelecionados = $event"
        :controlador="{
          busca: '',
          participantes: anosSelecionados,
        }"
        :grupo="anosDisponiveis"
        :aria-busy="false"
        label="ano"
      />
      <DetalhamentoDeCiclo
        v-for="ciclo in listaDeCiclosFiltrados"
        :id="`ciclo--${ciclo.id}`"
        :key="ciclo.id"
        :ciclo="ciclo"
        :meta-id="$route.params.meta_id"
        :open="$route.hash === `#ciclo--${ciclo.id}`
          ? true
          : false"
      />
    </div>
  </div>
</template>

<style lang="less" modules>
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

<script setup>
import { storeToRefs } from 'pinia';
import {
  computed, onMounted, ref,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';
import AutocompleteField from '@/components/AutocompleteField2.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import DetalhamentoDeCiclo from '@/components/monitoramentoDeMetas/DetalhamentoDeCiclo.vue';
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';

const route = useRoute();

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);

const {
  chamadasPendentes,
  ciclosPassadosPorAno,
  cicloAtivo,
  listaDeCiclosPassados,
  anoMaisRecenteNosCiclosPassados,
} = storeToRefs(monitoramentoDeMetasStore);

const anosDisponiveisNosCiclosPassados = computed(() => monitoramentoDeMetasStore
  .anosDisponiveisNosCiclosPassados
  .map((ano) => ({ ano, id: ano })));

const anosSelecionados = ref([]);

const listaDeCiclosFiltrados = computed(() => (!anosSelecionados.value.length
  ? listaDeCiclosPassados.value
  : anosSelecionados.value
    .flatMap((ano) => ciclosPassadosPorAno.value[ano] || [])));

watch(
  [() => route.params.planoSetorialId, () => route.params.meta_id],
  ([planoSetorialId, metaId]) => {
    monitoramentoDeMetasStore
      .buscarListaDeCiclos(planoSetorialId, {
        meta_id: metaId,
      }).then(() => {
        if (anoMaisRecenteNosCiclosPassados.value !== undefined) {
          anosSelecionados.value = [anoMaisRecenteNosCiclosPassados.value];
        }
      });
  },
  { immediate: true },
);

onMounted(() => {
  monitoramentoDeMetasStore.limparCiclos();
});

</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <TituloDePagina />

  <div class="flex column g2">
    <LoadingComponent v-if="chamadasPendentes.listaDeCiclos" />

    <template v-else>
      <DetalhamentoDeCiclo
        :id="`ciclo--${cicloAtivo?.id}`"
        :key="`ciclo--${cicloAtivo?.id}`"
        :ciclo-atual="true"
        :ciclo="cicloAtivo"
        :meta-id="$route.params.meta_id"
      />
    </template>

    <div
      v-if="listaDeCiclosPassados?.length"
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
        :controlador="{
          busca: '',
          participantes: anosSelecionados,
        }"
        :grupo="anosDisponiveisNosCiclosPassados"
        :aria-busy="false"
        label="ano"
        @change="anosSelecionados = $event"
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

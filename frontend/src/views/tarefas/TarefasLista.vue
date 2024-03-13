<script setup>
import LegendaEstimadoVsEfetivo from '@/components/LegendaEstimadoVsEfetivo.vue';
import LinhaDeCronograma from '@/components/projetos/LinhaDeCronograma.vue';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import CabecalhoResumo from '@/components/tarefas/CabecalhoResumo.vue';

const tarefasStore = useTarefasStore();
const {
  árvoreDeTarefas, chamadasPendentes, erro,
} = storeToRefs(tarefasStore);

const projetoEmFoco = computed(() => tarefasStore?.extra?.projeto);
const apenasLeitura = computed(() => !!projetoEmFoco.value?.permissoes?.apenas_leitura);

// eslint-disable-next-line max-len
const nívelMáximoPermitido = computed(() => tarefasStore?.extra?.portfolio?.nivel_maximo_tarefa || 0);

const nívelMáximoVisível = ref(0);

async function iniciar() {
  tarefasStore.$reset();
  await tarefasStore.buscarTudo();

  if (nívelMáximoPermitido.value) {
    nívelMáximoVisível.value = nívelMáximoPermitido.value;
  }
}

iniciar();
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2 g2">
    <TítuloDePágina>
      Cronograma
    </TítuloDePágina>

    <hr class="f1">

    <nav
      v-if="projetoEmFoco?.eh_prioritario && !apenasLeitura"
      class="flex g1"
    >
      <router-link
        :to="{ name: 'tarefasCriar' }"
        class="btn"
      >
        Nova tarefa
      </router-link>

      <router-link
        v-if="!árvoreDeTarefas.length"
        :to="{ name: 'tarefasClonar' }"
        class="btn"
      >
        Clonar tarefas
      </router-link>
    </nav>
  </div>
  <CabecalhoResumo :em-foco="projetoEmFoco" />
  <div class="mb2">
    <div class="">
      <label class="label tc300">
        Exibir tarefas até nível
      </label>
      <div class="flex center">
        <input
          id="nivel"
          v-model="nívelMáximoVisível"
          type="range"
          name="nivel"
          min="1"
          :max="nívelMáximoPermitido"
          class="f1"
        >
        <output
          class="f1 ml1"
        >
          {{ nívelMáximoVisível }}
        </output>
      </div>
    </div>
  </div>

  <LegendaEstimadoVsEfetivo />

  <table
    v-if="árvoreDeTarefas.length"
    class="tabela-de-etapas"
  >
    <colgroup>
      <col class="genealogia">
      <col>
      <col>
      <col>

      <col class="col--data">
      <col class="col--data">
      <col class="col--data">
      <col class="col--data">

      <col>
      <col>
      <col>

      <template v-if="!apenasLeitura">
        <col class="col--botão-de-ação">
        <col class="col--botão-de-ação">
        <col class="col--botão-de-ação">
      </template>
    </colgroup>

    <thead>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th />
        <th />
        <th />
        <th />
        <th
          colspan="2"
          class="dado-estimado"
        >
          Planejado
        </th>
        <th
          colspan="2"
          class="dado-efetivo"
        >
          Execução
        </th>
        <th colspan="2">
          Custo <small>(R$)</small>
        </th>
        <th />
        <template v-if="!apenasLeitura">
          <th />
          <th />
          <th />
        </template>
      </tr>
      <tr class="pl3 center mb05 tc300 w700 t12 uc">
        <th />
        <th />
        <th class="cell--number">
          % conclusão
        </th>
        <th class="cell--number">
          Duração
        </th>
        <th class="cell--data">
          Início
        </th>
        <th class="cell--data">
          Término
        </th>
        <th class="cell--data">
          Início
        </th>
        <th class="cell--data">
          Término
        </th>
        <th class="cell--number dado-estimado">
          Planejado
        </th>
        <th class="cell--number dado-efetivo">
          Real
        </th>
        <th class="cell--number">
          Atraso
        </th>
        <template v-if="!apenasLeitura">
          <th />
          <th />
          <th />
        </template>
      </tr>
    </thead>

    <tbody
      v-for="(r, i) in árvoreDeTarefas"
      :key="r.id"
      class="tabela-de-etapas__item"
    >
      <LinhaDeCronograma
        :key="r.id"
        :linha="r"
        :índice="i"
        :nível-máximo-visível="nívelMáximoVisível"
      />
    </tbody>
  </table>

  <span
    v-if="chamadasPendentes?.lista"
    class="spinner"
  >Carregando</span>

  <div
    v-if="erro"
    class="error p1"
  >
    <div class="error-msg">
      {{ erro }}
    </div>
  </div>

  <router-view />
</template>

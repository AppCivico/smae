<script setup>
import LegendaEstimadoVsEfetivo from '@/components/LegendaEstimadoVsEfetivo.vue';
import LinhaDeCronograma from '@/components/projetos/LinhaDeCronograma.vue';
import CabecalhoResumo from '@/components/tarefas/CabecalhoResumo.vue';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import { computed, ref } from 'vue';
import { useRoute } from 'vue-router';
import { useEmailsStore } from "@/stores/envioEmail.store";
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store.js';
import { useAlertStore } from '@/stores/alert.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';

const route = useRoute();
const tarefasStore = useTarefasStore();
const emailsStore = useEmailsStore();
const { emFoco:emailEmFoco } = storeToRefs(emailsStore);
const etapasProjetosStore = useEtapasProjetosStore();
const { árvoreDeTarefas, chamadasPendentes, erro } = storeToRefs(tarefasStore);
const alertStore = useAlertStore();
const projetosStore = useProjetosStore();
const projetoEmFoco = computed(() => tarefasStore?.extra?.projeto || tarefasStore?.extra?.cabecalho || {});
const apenasLeitura = computed(
  () => !!projetoEmFoco.value?.permissoes?.apenas_leitura,
);

const nívelMáximoPermitido = computed(() => {
  const extra = tarefasStore?.extra;

  return extra ? extra.portfolio?.nivel_maximo_tarefa || extra.cabecalho?.nivel_maximo_tarefa : 0;
});

const nívelMáximoEmUso = computed(() => tarefasStore.lista
  .reduce((acc, cur) => (cur.nivel > acc ? cur.nivel : acc), -Infinity));

const nivelMáximoDisponível = computed(() => Math.max(
  nívelMáximoPermitido.value,
  nívelMáximoEmUso.value,
));

const nívelMáximoVisível = ref(0);

const { lista:listaDeEtapas } = storeToRefs(etapasProjetosStore);

async function iniciar() {
  etapasProjetosStore.buscarTudo();
  emailsStore.buscarItem({ transferencia_id: route.params.transferenciaId });
  tarefasStore.$reset();
  await tarefasStore.buscarTudo();

  if (nívelMáximoPermitido.value) {
    nívelMáximoVisível.value = nivelMáximoDisponível.value;
  }
}

async function mudarEtapa(idEtapa) {
  const carga = {
    projeto_etapa_id: idEtapa
  }
  try {
    const msg = 'Etapa salva com sucesso!';
    const resposta =  await projetosStore.salvarItem(carga, projetoEmFoco.value.id)
    if (resposta) {
      alertStore.success(msg);
      tarefasStore.buscarTudo();
    }
  } catch (error) {
    alertStore.error(error);
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
    <TítuloDePágina> Cronograma </TítuloDePágina>
    <hr class="f1">
    <nav class="flex g1">
      <div
        v-if="
          projetoEmFoco?.eh_prioritario
            && !apenasLeitura
            && $route.meta.entidadeMãe === 'projeto'
        "
        class="dropbtn"
      >
        <span class="btn">Mudar etapa</span>
        <ul>
          <li
            v-for="etapa, index in listaDeEtapas"
            :key="index"
          >
            <button
              type="button"
              class="like-a__link"
              @click="mudarEtapa(etapa.id)"
            >
              {{ etapa.descricao }}
            </button>
          </li>
        </ul>
      </div>

      <router-link
        v-if="(projetoEmFoco?.eh_prioritario && !apenasLeitura)
          || route.meta.prefixoParaFilhas === 'TransferenciasVoluntarias'"
        :to="{
          name: $route.meta.prefixoParaFilhas + 'TarefasCriar',
          params: $route.params,
        }"
        class="dropbtn"
      >
       <span class="btn">Nova tarefa</span>
      </router-link>

      <router-link
        v-if="route.meta.entidadeMãe === 'projeto'"
        :to="{
          name: $route.meta.prefixoParaFilhas + 'TarefasClonar',
          params: $route.params,
        }"
        class="dropbtn"
      >
        <span class="btn"> Clonar tarefas </span>
      </router-link>
    </nav>
  </div>

  <LoadingComponent v-if="chamadasPendentes.lista" class="mb2 horizontal"/>
  <LoadingComponent v-if="projetosStore.chamadasPendentes.emFoco && $route.meta.entidadeMãe === 'projeto'" class="mb2 horizontal">Salvando</LoadingComponent>
  <div v-if="$route.meta.entidadeMãe === 'projeto' && projetoEmFoco.projeto_etapa" class="etapa mb2">
    <span>
      Etapa atual: {{ projetoEmFoco.projeto_etapa.descricao }}
    </span>
  </div>
  <CabecalhoResumo :em-foco="projetoEmFoco" :existe-email="emailEmFoco?.linhas[0]?.id !== undefined" :email-ativo="emailEmFoco?.linhas[0]?.ativo"/>

  <div class="flex center mb4" v-if="route.meta.prefixoParaFilhas === 'TransferenciasVoluntarias'" >
    <router-link :to="{ name: 'transferenciaEmailModal' }" class="addlink mb1">
      <svg width="20" height="20">
        <use xlink:href="#i_+" />
      </svg>
      <span v-if="emailEmFoco?.linhas[0]?.id">Editar envio de e-mail </span>
      <span v-else>Adicionar envio de e-mail</span>
    </router-link>
  </div>

  <div class="mb2">
    <div class="">
      <label class="label tc300"> Exibir tarefas até nível </label>
      <div class="flex center">
        <input
          id="nivel"
          v-model="nívelMáximoVisível"
          type="range"
          name="nivel"
          min="1"
          :max="nivelMáximoDisponível"
          class="f1"
        >
        <output class="f1 ml1">
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
          Real
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
        <th>
          Responsável
        </th>
        <th class="cell--number nowrap">
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

  <router-view @clonagem-concluída="iniciar" />
</template>
<style scoped>
.disparo-email {
  max-width: 900px;
}

.etapa{
  padding: 8px;
  background-color: #E2EAFE;
  font-size: 14px;
  color: #152741;
  line-height: 18px;
  display: inline-block;
  border-radius: 10px;
}
</style>

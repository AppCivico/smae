<script setup>
import LegendaEstimadoVsEfetivo from '@/components/LegendaEstimadoVsEfetivo.vue';
import LinhaDeCronograma from '@/components/projetos/LinhaDeCronograma.vue';
import CabecalhoResumo from '@/components/tarefas/CabecalhoResumo.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useEmailsStore } from '@/stores/envioEmail.store';
import { useEtapasProjetosStore } from '@/stores/etapasProjeto.store';
import { useObrasStore } from '@/stores/obras.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import {
  computed, defineOptions, ref, watch,
} from 'vue';
import { useRoute } from 'vue-router';

defineOptions({ inheritAttrs: false });

const route = useRoute();
const tarefasStore = useTarefasStore();
const emailsStore = useEmailsStore();
const { emFoco: emailEmFoco } = storeToRefs(emailsStore);
const etapasProjetosStore = useEtapasProjetosStore();
const { árvoreDeTarefas, chamadasPendentes, erro } = storeToRefs(tarefasStore);
const alertStore = useAlertStore();
const projetosStore = useProjetosStore();
const obrasStore = useObrasStore();

const projetoEmFoco = computed(
  () => tarefasStore?.extra?.projeto || tarefasStore?.extra?.cabecalho || {},
);
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

const podeMudarDeEtapaProjeto = computed(() => {
  if (!apenasLeitura.value) {
    if (route.meta.entidadeMãe === 'projeto' && projetoEmFoco.value?.eh_prioritario) {
      return true;
    }
    if (route.meta.entidadeMãe === 'obras') {
      return true;
    }
    return false;
  }
  return false;
});

const nívelMáximoVisível = ref(0);

const { lista: listaDeEtapas, erro: erroNaListaDeEtapas } = storeToRefs(etapasProjetosStore);

async function iniciar() {
  emailsStore.buscarItem({ transferencia_id: route.params.transferenciaId });
  tarefasStore.$reset();
  await tarefasStore.buscarTudo();

  if (nívelMáximoPermitido.value) {
    nívelMáximoVisível.value = nivelMáximoDisponível.value;
  }
}

async function mudarEtapa(idEtapa) {
  const carga = {
    projeto_etapa_id: idEtapa,
  };

  const msg = 'Etapa salva com sucesso!';

  let resposta;

  try {
    switch (route.meta.entidadeMãe) {
      case 'obras':
        resposta = await obrasStore.salvarItem(carga, projetoEmFoco.value.id);

        break;
      case 'projeto':
        resposta = await projetosStore.salvarItem(carga, projetoEmFoco.value.id);

        break;

      default:
        console.trace('Não foi possível identificar o módulo');
        throw new Error('Não foi possível identificar o módulo');
    }

    if (resposta) {
      alertStore.success(msg);
      tarefasStore.buscarTudo();
    }
  } catch (error) {
    alertStore.error(error);
  }
}
iniciar();

watch(podeMudarDeEtapaProjeto, (novoValor) => {
  if (novoValor) {
    etapasProjetosStore.buscarTudo();
  }
}, { immediate: true });
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="flex spacebetween center mb2 mt2 g2">
    <TítuloDePágina id="titulo-da-pagina">
      Cronograma
    </TítuloDePágina>
    <hr class="f1">
    <nav class="flex g1">
      <div
        v-if="podeMudarDeEtapaProjeto && listaDeEtapas.length"
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

      <SmaeLink
        v-if="(!apenasLeitura)
          || route.meta.entidadeMãe === 'TransferenciasVoluntarias'"
        :to="{
          name: '.TarefasCriar',
          params: $route.params,
        }"
        class="dropbtn"
      >
        <span class="btn">Nova tarefa</span>
      </SmaeLink>

      <SmaeLink
        v-if="route.meta.entidadeMãe === 'projeto'
          || route.meta.entidadeMãe === 'obras'"
        :to="{
          name: '.TarefasClonar',
          params: $route.params,
        }"
        class="dropbtn"
      >
        <span class="btn"> Clonar tarefas </span>
      </SmaeLink>
    </nav>
  </div>

  <ErrorComponent
    v-if="erroNaListaDeEtapas"
    class="mb1"
  >
    {{ erroNaListaDeEtapas }}
  </ErrorComponent>

  <LoadingComponent
    v-if="chamadasPendentes.lista"
    class="mb2 horizontal"
  />
  <LoadingComponent
    v-if="projetosStore.chamadasPendentes.emFoco && $route.meta.entidadeMãe === 'projeto'"
    class="mb2 horizontal"
  >
    Salvando
  </LoadingComponent>
  <div
    v-if="$route.meta.entidadeMãe === 'projeto'
      || $route.meta.entidadeMãe === 'obras'
      || $route.entidadeMãe === 'mdo'
      && projetoEmFoco.projeto_etapa"
    class="etapa mb2"
  >
    <span>
      Etapa atual: {{ projetoEmFoco?.projeto_etapa?.descricao }}
    </span>
  </div>
  <CabecalhoResumo
    :em-foco="projetoEmFoco"
    :existe-email="emailEmFoco?.linhas[0]?.id !== undefined"
    :email-ativo="emailEmFoco?.linhas[0]?.ativo"
  />

  <div
    v-if="route.meta.entidadeMãe === 'TransferenciasVoluntarias'"
    class="flex center mb4"
  >
    <SmaeLink
      :to="{ name: 'transferenciaEmailModal' }"
      class="addlink mb1"
    >
      <svg
        width="20"
        height="20"
      >
        <use xlink:href="#i_+" />
      </svg>
      <span v-if="emailEmFoco?.linhas[0]?.id">Editar envio de e-mail </span>
      <span v-else>Adicionar envio de e-mail</span>
    </SmaeLink>
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

  <div
    role="region"
    aria-labelledby="titulo-da-pagina"
    tabindex="0"
    class="pl2"
    style="margin-left: -2rem"
  >
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

        <col class="col--number">
        <col class="col--number">
        <col class="col--number">
        <col>
        <col class="col--botão-de-ação">

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
            Real
          </th>
          <th colspan="2">
            Custo <small>(R$)</small>
          </th>
          <th />
          <th />
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
          <th>
            Responsável
          </th>
          <th />
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
  </div>

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

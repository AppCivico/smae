<script setup>
import { storeToRefs } from 'pinia';
import {
  computed,
  defineOptions, defineProps,
  ref, watch,
} from 'vue';
import {
  onBeforeRouteLeave, onBeforeRouteUpdate, useRoute, useRouter,
} from 'vue-router';

import EnvelopeDeAbas from '@/components/EnvelopeDeAbas.vue';
import MigalhasDeMetas from '@/components/metas/MigalhasDeMetas.vue';
import FormularioDeFase from '@/components/monitoramentoDeMetas/FormularioDeFase.vue';
import dateToTitle from '@/helpers/dateToTitle';
import { useAlertStore } from '@/stores/alert.store';
import { useMonitoramentoDeMetasStore } from '@/stores/monitoramentoDeMetas.store';

const route = useRoute();
const router = useRouter();
const alertStore = useAlertStore();

defineOptions({
  inheritAttrs: false,
});

const props = defineProps({
  cicloId: {
    type: [
      Number,
      String,
    ],
    required: true,
  },
});

const monitoramentoDeMetasStore = useMonitoramentoDeMetasStore(route.meta.entidadeMãe);

const {
  chamadasPendentes,
  ciclosDetalhadosPorId,
  erros,
  fasesDoCicloEmFoco,
} = storeToRefs(monitoramentoDeMetasStore);

const formulariosSujos = ref({});

// a API já entrega apenas as fases e os blocos habilitados, em ordem
const fases = computed(() => fasesDoCicloEmFoco.value?.fases || []);

function buscarFases() {
  return monitoramentoDeMetasStore.buscarFasesDoCiclo(
    route.params.planoSetorialId,
    props.cicloId,
    { meta_id: route.params.meta_id },
  );
}

function aoSalvarFase() {
  // para a lista de monitoramento não exibir dados defasados
  if (ciclosDetalhadosPorId.value[props.cicloId]) {
    delete ciclosDetalhadosPorId.value[props.cicloId];
  }

  buscarFases();
}

watch([
  () => route.params.planoSetorialId,
  () => route.params.meta_id,
  () => props.cicloId,
], () => {
  // evitar a exibição das fases de outro ciclo ou de outra meta
  fasesDoCicloEmFoco.value = null;
  formulariosSujos.value = {};

  buscarFases();
}, { immediate: true });

// Sem aba na query, abrir a próxima fase a preencher ou, com todas preenchidas,
// a última. As abas só são montadas depois disso porque, do contrário, o
// `EnvelopeDeAbas` abriria a primeira.
watch([
  fases,
  () => route.query.aba,
], () => {
  if (!fases.value.length || route.query.aba) return;

  const proximaFase = fases.value.find((fase) => !fase.preenchida)
    || fases.value[fases.value.length - 1];

  router.replace({
    params: route.params,
    query: {
      ...route.query,
      aba: `fase-${proximaFase.config.id}`,
    },
  });
}, { immediate: true });

const formularioSujo = computed(() => Object.values(formulariosSujos.value).some(Boolean));

let trocaDeAbaConfirmada = false;

onBeforeRouteUpdate((para, de) => {
  if (trocaDeAbaConfirmada) {
    trocaDeAbaConfirmada = false;
    return true;
  }

  const faseAberta = fases.value.find((fase) => `fase-${fase.config.id}` === de.query.aba);

  if (
    para.query.aba === de.query.aba
    || !faseAberta
    || !formulariosSujos.value[faseAberta.config.id]
  ) {
    return true;
  }

  alertStore.confirmAction(
    'Há alterações não salvas nessa aba. Deseja trocar de aba mesmo assim?',
    () => {
      trocaDeAbaConfirmada = true;
      router.push(para);
    },
    'Trocar de aba',
  );

  return false;
});

let saidaConfirmada = false;

onBeforeRouteLeave((para) => {
  if (saidaConfirmada) {
    saidaConfirmada = false;
    return true;
  }

  if (!formularioSujo.value) {
    return true;
  }

  alertStore.confirmAction(
    'Há alterações não salvas. Deseja sair mesmo assim?',
    () => {
      saidaConfirmada = true;
      router.push(para);
    },
    'Sair',
  );

  return false;
});
</script>
<template>
  <MigalhasDeMetas class="mb1" />

  <!-- sem `formulario-sujo`: a confirmação de saída é feita no `onBeforeRouteLeave` -->
  <CabecalhoDePagina class="mb2" />

  <ErrorComponent
    :erro="erros.fasesDoCicloEmFoco"
    class="mb2"
  />

  <div class="titulo-monitoramento mb2">
    <h2 class="tc500 t20 titulo-monitoramento__text w400">
      Ciclo: {{ dateToTitle(fasesDoCicloEmFoco?.ciclo.data_ciclo) }}
    </h2>
  </div>

  <LoadingComponent v-if="chamadasPendentes.fasesDoCicloEmFoco && !fasesDoCicloEmFoco" />

  <EnvelopeDeAbas
    v-else-if="fases.length && $route.query.aba"
    alinhamento="esquerda"
  >
    <template
      v-for="fase in fases"
      #[`fase-${fase.config.id}__cabecalho`]
      :key="`cabecalho-${fase.config.id}`"
    >
      {{ fase.config.rotulo }}
    </template>

    <template
      v-for="fase in fases"
      #[`fase-${fase.config.id}`]
      :key="fase.config.id"
    >
      <FormularioDeFase
        :fase="fase.config"
        :ciclo-id="cicloId"
        :atual="fase.atual"
        :anterior="fase.anterior"
        :documentos="fase.documentos"
        :editavel="fase.editavel"
        @update:sujo="formulariosSujos[fase.config.id] = $event"
        @salvo="aoSalvarFase"
        @documentos-alterados="aoSalvarFase"
      />
    </template>
  </EnvelopeDeAbas>

  <p
    v-else-if="!fases.length && !erros.fasesDoCicloEmFoco"
    class="t12 tc300 w700"
  >
    Nenhuma fase de monitoramento habilitada.
  </p>
</template>

<script setup>
import {
  computed,
  onUnmounted,
  ref,
  toRef,
  watch,
} from 'vue';
import { useRoute } from 'vue-router';

import AnimatedNumber from '@/components/AnimatedNumber.vue';
import SimpleOrcamentoCusteio from '@/components/orcamento/SimpleOrcamentoCusteio.vue';
import SimpleOrcamentoPlanejado from '@/components/orcamento/SimpleOrcamentoPlanejado.vue';
import SimpleOrcamentoRealizado from '@/components/orcamento/SimpleOrcamentoRealizado.vue';
import dinheiro from '@/helpers/dinheiro';
import { useAlertStore } from '@/stores/alert.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';

defineOptions({ inheritAttrs: false });

const alertStore = useAlertStore();
const OrcamentosStore = useOrcamentosStore();

const route = useRoute();
const props = defineProps({
  anosDoOrcamento: {
    type: Array,
    default: () => [],
  },
  parametrosDeConsulta: {
    type: Object,
    default: () => ({}),
  },
});

const etiquetasValores = {
  soma_valor_empenho: 'Total geral empenhado',
  soma_valor_liquidado: 'Total geral liquidado',
  valor_planejado: 'Total geral',
  custo_previsto: 'Total geral',
};

let SimpleOrcamento;

let consolidado = null;

switch (route.meta.area) {
  case 'Realizado':
    SimpleOrcamento = SimpleOrcamentoRealizado;
    consolidado = toRef(OrcamentosStore, 'realizadoConsolidado');
    break;
  case 'Planejado':
    SimpleOrcamento = SimpleOrcamentoPlanejado;
    consolidado = toRef(OrcamentosStore, 'planejadoConsolidado');
    break;
  default:
    SimpleOrcamento = SimpleOrcamentoCusteio;
    consolidado = toRef(OrcamentosStore, 'custeioConsolidado');
    break;
}

const chamadasPendentes = ref(false);

const etiquetaDosTotais = computed(() => {
  switch (route.meta.entidadeMãe) {
    case 'projeto':
      return 'Total do projeto';
    case 'obras':
      return 'Total da obra';
    default:
      return 'Totais da meta';
  }
});

const configuracaoDeOrcamentosPorAno = computed(() => (Array.isArray(props.anosDoOrcamento)
  ? props.anosDoOrcamento.map((x) => ({
    ano_referencia: x,
    ...props.parametrosDeConsulta,
  }))
  : []));

const orcamentosDoAnoCorrente = computed(() => configuracaoDeOrcamentosPorAno.value
  .filter((x) => x.ano_referencia === new Date().getUTCFullYear()));

const orcamentosDosAnosFuturos = computed(() => configuracaoDeOrcamentosPorAno.value
  .filter((x) => x.ano_referencia > new Date().getUTCFullYear()));

const orcamentosDosAnosPassados = computed(() => configuracaoDeOrcamentosPorAno.value
  .filter((x) => x.ano_referencia < new Date().getUTCFullYear()));

function iniciar() {
  const promessas = [];

  chamadasPendentes.value = true;

  configuracaoDeOrcamentosPorAno.value.forEach((x) => {
    switch (route.meta.area) {
      case 'Custo':
        promessas.push(OrcamentosStore.buscarOrçamentosPrevistosParaAno(x.ano_referencia));
        break;

      case 'Planejado':
        promessas.push(OrcamentosStore.buscarOrçamentosPlanejadosParaAno(x.ano_referencia));
        break;

      case 'Realizado':
        promessas.push(OrcamentosStore.buscarOrçamentosRealizadosParaAno(x.ano_referencia));
        break;

      default:
        alertStore.error('Tipo de orçamento faltando!');
        break;
    }
  });

  Promise.allSettled(promessas)
    .then(() => {
      chamadasPendentes.value = false;
    });
}

watch(() => props.anosDoOrcamento, () => {
  iniciar();
}, { immediate: true });

onUnmounted(() => {
  OrcamentosStore.$reset();
});
</script>
<template>
  <header class="flex spacebetween center mb2">
    <TítuloDePágina>
      Orçamentos
    </TítuloDePágina>

    <hr class="ml2 f1">
  </header>
  <LoadingComponent v-if="chamadasPendentes" />
  <template v-else>
    <dl
      v-for="item, key in consolidado.valor"
      :key="key"
      class="flex flexwrap justifyright totalizador t18"
    >
      <dt class="w700 titulo">
        {{ etiquetasValores[key] || key }}
      </dt>
      <dd class="mb025">
        {{ consolidado.anoDeInicio }} - {{ consolidado.anoDeConclusao }}
      </dd>
      <AnimatedNumber
        :value="item"
        as="dd"
        :formatter="dinheiro"
        slowness="2"
        class="fb100 tr tc500 w700 mb2"
      >
        <template #prefix>
          R$
        </template>
      </AnimatedNumber>
    </dl>
  </template>

  <div class="boards">
    <p
      v-if="!anosDoOrcamento.length"
      class="error p1"
    >
      <strong>Não</strong> há anos disponíveis para preenchimento do orçamento.
    </p>

    <template v-if="orcamentosDoAnoCorrente?.length">
      <h2 class="mb2">
        Ano corrente
      </h2>
      <template
        v-for="orc in orcamentosDoAnoCorrente"
        :key="orc.id"
      >
        <component
          :is="SimpleOrcamento"
          :config="orc"
          :etiqueta-dos-totais="etiquetaDosTotais"
          @apagar="iniciar"
        />
      </template>
    </template>

    <template v-if="orcamentosDosAnosFuturos?.length">
      <h2 class="mb2">
        Próximos anos
      </h2>
      <template
        v-for="orc in orcamentosDosAnosFuturos"
        :key="orc.id"
      >
        <component
          :is="SimpleOrcamento"
          :config="orc"
          :etiqueta-dos-totais="etiquetaDosTotais"
        />
      </template>
    </template>
    <template v-if="orcamentosDosAnosPassados?.length">
      <h2 class="mb2">
        Anos anteriores
      </h2>
      <template
        v-for="orc in orcamentosDosAnosPassados"
        :key="orc.id"
      >
        <component
          :is="SimpleOrcamento"
          :config="orc"
          :etiqueta-dos-totais="etiquetaDosTotais"
        />
      </template>
    </template>
  </div>
</template>

<style scoped lang="less">
.totalizador{
  .titulo::after{
    content: ' - ';
    margin-right: 0.25em;
  }
}
</style>

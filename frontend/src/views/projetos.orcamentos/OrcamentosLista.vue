<script setup>
import SimpleOrcamentoCusteio from '@/components/orcamento/SimpleOrcamentoCusteio.vue';
import SimpleOrcamentoPlanejado from '@/components/orcamento/SimpleOrcamentoPlanejado.vue';
import SimpleOrcamentoRealizado from '@/components/orcamento/SimpleOrcamentoRealizado.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { range } from 'lodash';
import { computed, watch } from 'vue';
import { useRoute } from 'vue-router';

const alertStore = useAlertStore();
const ProjetosStore = useProjetosStore();
const OrcamentosStore = useOrcamentosStore();
OrcamentosStore.clear();
const route = useRoute();
const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

const { area } = route.meta;

const portfolioId = computed(() => ProjetosStore?.emFoco?.portfolio_id);
const rotaParaAdição = { name: '' };

const SimpleOrcamento = area === 'Realizado'
  ? SimpleOrcamentoRealizado
  : area === 'Planejado'
    ? SimpleOrcamentoPlanejado
    : SimpleOrcamentoCusteio;

const anosNaDuraçãoDoProjeto = computed(() => {
  const inicío = Number((ProjetosStore.emFoco?.previsao_inicio || '').split('-')[0] ?? null);
  const término = Number((ProjetosStore.emFoco?.realizado_termino || ProjetosStore.emFoco?.previsao_termino || '').split('-')[0] ?? null);

  return inicío && término
    ? range(inicío, término + 1)
    : [];
});

const configuraçãoDeOrçamentosPorAno = computed(() => anosNaDuraçãoDoProjeto.value.map((x) => ({
  ano_referencia: x,
  portfolio_id: portfolioId,
  parent_link: '',
  // rotaParaEdição: { name: '' }, // SOBRAL, AQUI!
  previsao_custo_disponivel: true,
  planejado_disponivel: true,
  execucao_disponivel: true,
})));

const orçamentosDoAnoCorrente = computed(() => configuraçãoDeOrçamentosPorAno.value
  .filter((x) => x.ano_referencia === new Date().getUTCFullYear()));

const orçamentosDosAnosFuturos = computed(() => configuraçãoDeOrçamentosPorAno.value
  .filter((x) => x.ano_referencia > new Date().getUTCFullYear()));

const orçamentosDosAnosPassados = computed(() => configuraçãoDeOrçamentosPorAno.value
  .filter((x) => x.ano_referencia < new Date().getUTCFullYear()));

function iniciar() {
  configuraçãoDeOrçamentosPorAno.value.forEach((x) => {
    switch (area) {
      case 'Custo':
        OrcamentosStore.buscarOrçamentosPrevistosParaProjeto(x.ano_referencia, props.projetoId);
        break;

      case 'Planejado':
        OrcamentosStore.buscarOrçamentosPlanejadosParaProjeto(x.ano_referencia, props.projetoId);
        break;

      case 'Realizado':
        OrcamentosStore.buscarOrçamentosRealizadosParaProjeto(x.ano_referencia, props.projetoId);
        break;

      default:
        alertStore.error('Tipo de orçamento faltando!');
        break;
    }
  });
}

watch(anosNaDuraçãoDoProjeto, () => {
  iniciar();
});

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>
      {{ typeof route?.meta?.título === 'function'
        ? route.meta.título()
        : route?.meta?.título || 'Orçamentos' }}
    </h1>
    <hr class="ml2 f1">
  </div>

  <div class="boards">
    <template v-if="portfolioId">
      <p
        v-if="!anosNaDuraçãoDoProjeto.length"
        class="error p1"
      >
        Esse projeto <strong>não</strong> tem duração definida.
      </p>

      <template v-if="orçamentosDoAnoCorrente.length">
        <h2 class="mb2">
          Ano corrente
        </h2>
        <template
          v-for="orc in orçamentosDoAnoCorrente"
          :key="orc.id"
        >
          <SimpleOrcamento
            :projeto-id="projetoId"
            :config="orc"
            :rota-para-adição="rotaParaAdição"
          />
        </template>
      </template>

      <template v-if="orçamentosDosAnosFuturos.length">
        <h2 class="mb2">
          Próximos anos
        </h2>
        <template
          v-for="orc in orçamentosDosAnosFuturos"
          :key="orc.id"
        >
          <SimpleOrcamento
            :projeto-id="projetoId"
            :config="orc"
            :rota-para-adição="rotaParaAdição"
          />
        </template>
      </template>
      <template v-if="orçamentosDosAnosPassados.length">
        <h2 class="mb2">
          Anos anteriores
        </h2>
        <template
          v-for="orc in orçamentosDosAnosPassados"
          :key="orc.id"
        >
          <SimpleOrcamento
            :projeto-id="projetoId"
            :config="orc"
            :rota-para-adição="rotaParaAdição"
          />
        </template>
      </template>
    </template>
    <template v-else-if="ProjetosStore.chamadasPendentes.emFoco">
      <div class="p1">
        <span>Carregando</span> <svg
          class="ml1 ib"
          width="20"
          height="20"
        ><use xlink:href="#i_spin" /></svg>
      </div>
    </template>
    <template v-else-if="ProjetosStore.erro">
      <div class="error p1">
        <p class="error-msg">
          Error: {{ ProjetosStore.erro }}
        </p>
      </div>
    </template>
  </div>
</template>

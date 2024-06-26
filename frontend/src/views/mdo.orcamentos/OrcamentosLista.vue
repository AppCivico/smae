<script setup>
import SimpleOrcamentoCusteio from '@/components/orcamento/SimpleOrcamentoCusteio.vue';
import SimpleOrcamentoPlanejado from '@/components/orcamento/SimpleOrcamentoPlanejado.vue';
import SimpleOrcamentoRealizado from '@/components/orcamento/SimpleOrcamentoRealizado.vue';
import { useAlertStore } from '@/stores/alert.store';
import { useObrasStore } from '@/stores/obras.store';
import { useOrcamentosStore } from '@/stores/orcamentos.store';
import { computed, defineOptions, watch } from 'vue';
import { useRoute } from 'vue-router';

// PRA-FAZER: esse arquivo é quase igual ao de projetos. Pode-se melhorar.

defineOptions({ inheritAttrs: false });

const alertStore = useAlertStore();
const ObrasStore = useObrasStore();
const OrcamentosStore = useOrcamentosStore();
OrcamentosStore.clear();
const route = useRoute();
defineProps({
  obraId: {
    type: Number,
    default: 0,
  },
});

const { area } = route.meta;

const portfolioId = computed(() => ObrasStore?.emFoco?.portfolio_id);
const rotaParaAdição = { name: '' };

let SimpleOrcamento;

switch (area) {
  case 'Realizado':
    SimpleOrcamento = SimpleOrcamentoRealizado;
    break;
  case 'Planejado':
    SimpleOrcamento = SimpleOrcamentoPlanejado;
    break;
  default:
    SimpleOrcamento = SimpleOrcamentoCusteio;
}

const anosNaDuraçãoDoObra = computed(() => ObrasStore.emFoco?.ano_orcamento || []);

const configuraçãoDeOrçamentosPorAno = computed(() => anosNaDuraçãoDoObra.value.map((x) => ({
  ano_referencia: x,
  portfolio_id: portfolioId.value,
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
        OrcamentosStore.buscarOrçamentosPrevistosParaAno(x.ano_referencia);
        break;

      case 'Planejado':
        OrcamentosStore.buscarOrçamentosPlanejadosParaAno(x.ano_referencia);
        break;

      case 'Realizado':
        OrcamentosStore.buscarOrçamentosRealizadosParaAno(x.ano_referencia);
        break;

      default:
        alertStore.error('Tipo de orçamento faltando!');
        break;
    }
  });
}
// caso a rota seja carregada diretamente, é possível que ainda não tenhamos os
// dados de obras prontos. Portanto, vamos ficar de olho neles.
watch(() => ObrasStore?.emFoco, iniciar);

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina>
      Orçamentos
    </TítuloDePágina>

    <hr class="ml2 f1">
  </div>

  <div class="boards">
    <template v-if="portfolioId">
      <p
        v-if="!anosNaDuraçãoDoObra.length"
        class="error p1"
      >
        <strong>Não</strong> há anos disponíveis para preenchimento do orçamento.
      </p>

      <template v-if="orçamentosDoAnoCorrente.length">
        <h2 class="mb2">
          Ano corrente
        </h2>
        <template
          v-for="orc in orçamentosDoAnoCorrente"
          :key="orc.id"
        >
          <component
            :is="SimpleOrcamento"
            :obra-id="obraId"
            :config="orc"
            :rota-para-adição="rotaParaAdição"
            @apagar="iniciar"
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
          <component
            :is="SimpleOrcamento"
            :obra-id="obraId"
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
          <component
            :is="SimpleOrcamento"
            :obra-id="obraId"
            :config="orc"
            :rota-para-adição="rotaParaAdição"
          />
        </template>
      </template>
    </template>
    <template v-else-if="ObrasStore.chamadasPendentes.emFoco">
      <div class="p1">
        <span>Carregando</span> <svg
          class="ml1 ib"
          width="20"
          height="20"
        ><use xlink:href="#i_spin" /></svg>
      </div>
    </template>
    <template v-else-if="ObrasStore.erro">
      <div class="error p1">
        <p class="error-msg">
          Error: {{ ObrasStore.erro }}
        </p>
      </div>
    </template>
  </div>
</template>

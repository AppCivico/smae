<script setup>
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaBásica from '@/components/relatorios/TabelaBasica.vue';
import { relatórioDePortfolio as schema } from '@/consts/formSchemas';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import {
  ref,
  onUnmounted,
  computed,
  watch,
} from 'vue';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { prepararEtiquetas, prepararPortfolios, prepararÓrgãos } from './helpers/preparadorDeColunaParametros';

const relatóriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());
const fonte = 'Projetos';

const etiquetasParaValoresDeParâmetros = ref({
  portfolio_id: {},
  orgao_responsavel_id: {},
});

const etiquetasParaParâmetros = prepararEtiquetas(schema);
let intervaloDeAtualizacao = null;
const temAlgumRelatorioEmProcessamento = computed(() => relatóriosStore
  .lista.some((relatorio) => !relatorio.arquivo));

async function carregarRelatorios() {
  await relatóriosStore.getAll({ fonte });
}

async function iniciar() {
  relatóriosStore.$reset();
  await carregarRelatorios();

  etiquetasParaValoresDeParâmetros.value.portfolio_id = await prepararPortfolios();
  etiquetasParaValoresDeParâmetros.value.orgao_responsavel_id = await prepararÓrgãos();
}

watch(temAlgumRelatorioEmProcessamento, (novoValor) => {
  if (novoValor) {
    if (!intervaloDeAtualizacao) {
      intervaloDeAtualizacao = setInterval(carregarRelatorios, 5000);
    }
  } else {
    clearInterval(intervaloDeAtualizacao);
    intervaloDeAtualizacao = null;
  }
});

iniciar();

onUnmounted(() => {
  if (intervaloDeAtualizacao) {
    clearInterval(intervaloDeAtualizacao);
  }
});
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.') "
      :to="{ name: 'novoRelatórioDePortfolio' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>

  <TabelaBásica
    class="mb1"
    :etiquetas-para-valores-de-parâmetros="etiquetasParaValoresDeParâmetros"
    :etiquetas-para-parâmetros="etiquetasParaParâmetros"
  />

  <BotãoParaCarregarMais :fonte="fonte" />
</template>

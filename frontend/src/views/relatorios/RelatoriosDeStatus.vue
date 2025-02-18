<script setup>
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaBásica from '@/components/relatorios/TabelaBasica.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import {
  ref,
  onUnmounted,
  computed,
  watch,
} from 'vue';
import { relatórioDeStatus as schema } from '@/consts/formSchemas';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { prepararEtiquetas, prepararPortfolios } from './helpers/preparadorDeColunaParametros';

const relatóriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());
const fonte = 'ProjetoStatus';
const etiquetasParaValoresDeParâmetros = ref({
  portfolio_id: {},
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
      :to="{ name: 'novoRelatórioDeStatus' }"
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

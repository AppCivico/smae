<script setup>
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaBásica from '@/components/relatorios/TabelaBasica.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { relatórioDePrevisãoDeCustoPortfolioObras as schema } from '@/consts/formSchemas';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import { prepararEtiquetas, prepararPortfoliosObras } from './helpers/preparadorDeColunaParametros';

const relatóriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());

const fonte = 'ObrasPrevisaoCusto';

const etiquetasParaValoresDeParâmetros = ref({
  portfolio_id: {},
});

const etiquetasParaParâmetros = prepararEtiquetas(schema);

async function iniciar() {
  relatóriosStore.$reset();
  relatóriosStore.getAll({ fonte });

  etiquetasParaValoresDeParâmetros.value.portfolio_id = await prepararPortfoliosObras();
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.MDO') "
      :to="{ name: 'novoRelatórioDePrevisãoDeCustoPortfolioObras' }"
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

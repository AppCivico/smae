<script setup>
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaBásica from '@/components/relatorios/TabelaBasica.vue';
import { relatórioDeParlamentares as schema } from '@/consts/formSchemas';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { prepararCargos, prepararEtiquetas, prepararPartidos } from './helpers/preparadorDeColunaParametros';

const relatóriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());
const fonte = 'Parlamentares';
const etiquetasParaValoresDeParâmetros = ref({
  partido_id: {},
  cargo: {},
});

const etiquetasParaParâmetros = prepararEtiquetas(schema);

async function iniciar() {
  relatóriosStore.$reset();
  relatóriosStore.getAll({ fonte });
  etiquetasParaValoresDeParâmetros.value.partido_id = await prepararPartidos();
  etiquetasParaValoresDeParâmetros.value.cargo = prepararCargos();
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.')"
      :to="{ name: 'novoRelatórioDeParlamentares' }"
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

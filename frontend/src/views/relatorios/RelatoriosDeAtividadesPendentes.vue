<script setup>
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import TabelaBásica from '@/components/relatorios/TabelaBasica.vue';
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import { relatórioAtividadesPendentes as schema } from '@/consts/formSchemas';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import {
  prepararEtiquetas,
  prepararEsferaDeTransferência,
  prepararTipoTransferencia,
} from './helpers/preparadorDeColunaParametros';


const relatóriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());
const fonte = 'CasaCivilAtvPendentes';
const etiquetasParaValoresDeParâmetros = ref({
  categoria: {},
  esfera: {},
  tipo_id: {},
  id: {},
  nome: {},
});

const etiquetasParaParâmetros = prepararEtiquetas(schema);

async function iniciar() {
  relatóriosStore.$reset();
  relatóriosStore.getAll({ fonte });
  etiquetasParaValoresDeParâmetros.value.esfera = prepararEsferaDeTransferência();
  etiquetasParaValoresDeParâmetros.value.tipo_id = await prepararTipoTransferencia();
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.')"
      :to="{ name: 'novoRelatórioDeAtividadePendente' }"
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

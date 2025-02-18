<script setup>
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaBásica from '@/components/relatorios/TabelaBasica.vue';
import { relatórioDeTransferênciasVoluntárias as schema } from '@/consts/formSchemas';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
// Mantendo comportamento legado
// eslint-disable-next-line import/no-cycle
import {
  prepararEsferaDeTransferência,
  prepararEtiquetas,
  prepararInterfaceDeTransferência,
  prepararParlamentares,
  prepararPartidos,
  prepararÓrgãos,
} from './helpers/preparadorDeColunaParametros';

const relatóriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());
const fonte = 'Transferencias';
const etiquetasParaValoresDeParâmetros = ref({
  esfera: {},
  interface: {},
  orgao_concedente_id: {},
  partido_id: {},
  parlamentar_id: {},
  orgao_gestor_id: {},
});

const etiquetasParaParâmetros = prepararEtiquetas(schema);

async function iniciar() {
  relatóriosStore.$reset();
  relatóriosStore.getAll({ fonte });
  etiquetasParaValoresDeParâmetros.value.esfera = prepararEsferaDeTransferência();
  etiquetasParaValoresDeParâmetros.value.interface = prepararInterfaceDeTransferência();
  etiquetasParaValoresDeParâmetros.value.orgao_concedente_id = await prepararÓrgãos();
  etiquetasParaValoresDeParâmetros.value.orgao_gestor_id = await prepararÓrgãos();
  etiquetasParaValoresDeParâmetros.value.partido_id = await prepararPartidos();
  etiquetasParaValoresDeParâmetros.value.parlamentar_id = await prepararParlamentares();
}

iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <TítuloDePágina />
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.')"
      :to="{ name: 'novoRelatórioDeTransferênciasVoluntárias' }"
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

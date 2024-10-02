<script setup>
import TabelaBásica from '@/components/relatorios/TabelaBasica.vue';
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';
import { ref } from 'vue';
import { relatórioDePrevisãoDeCustoPlanosSetoriais as schema } from '@/consts/formSchemas';
import { prepararEtiquetas, prepararTags, prepararPdm } from './helpers/preparadorDeColunaParametros';

const relatóriosStore = useRelatoriosStore();
const { temPermissãoPara } = storeToRefs(useAuthStore());
const fonte = 'PSPrevisaoCusto';
const etiquetasParaValoresDeParâmetros = ref({
  iniciativa_id: {},
  atividade_id: {},
  pdm_id: {},
  meta_id: {},
  tags: {},
});

const etiquetasParaParâmetros = {
  ...prepararEtiquetas(schema),
  // TODO: vai dar um trampo enorme pegar esse pessoal. Vamos desabilitá-los por enquanto
  atividade_id: undefined,
  iniciativa_id: undefined,
  meta_id: undefined,
};

async function iniciar() {
  relatóriosStore.$reset();
  relatóriosStore.getAll({ fonte });
  etiquetasParaValoresDeParâmetros.value.tags = await prepararTags();
  etiquetasParaValoresDeParâmetros.value.pdm_id = await prepararPdm();
}
iniciar();
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.PlanoSetorial') "
      :to="{ name: 'novoRelatórioDePrevisãoDeCustoPlanosSetoriais' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>
  <p class="texto--explicativo">SMAE gera uma planilha contendo os registros de previsão de custo registrados nas metas</p>
  <TabelaBásica
    class="mb1"
    :etiquetas-para-valores-de-parâmetros="etiquetasParaValoresDeParâmetros"
    :etiquetas-para-parâmetros="etiquetasParaParâmetros"
  />

  <BotãoParaCarregarMais :fonte="fonte" />
</template>

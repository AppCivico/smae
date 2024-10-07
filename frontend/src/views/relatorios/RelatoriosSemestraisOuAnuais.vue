<script setup>
import { storeToRefs } from 'pinia';
import { useRoute } from 'vue-router';
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaDeSemestraisOuAnuais from '@/components/relatorios/TabelaDeSemestraisOuAnuais.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const route = useRoute();
const relatóriosStore = useRelatoriosStore();
const fonte = route.meta.fonteParaRelatório;

relatóriosStore.$reset();
relatóriosStore.getAll({ fonte });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <SmaeLink
      v-if="temPermissãoPara('Reports.executar.') "
      :to="{name: '.novoRelatórioSemestralOuAnual'}"
      class="btn big ml2"
    >
      Novo relatório
    </SmaeLink>
  </div>

  <p class="texto--explicativo">
    SMAE gera um conjunto de 2 planilhas contendo os indicadores da meta e de
    seus desdobramentos e valores das variáveis regionalizadas. A versão
    analítica retorna todos os valores das séries, desde o inicio da medição até
    o periodo informado, e a consolidada somente os valores consolidados do
    final de cada semestre/ano.
  </p>
  <!-- <p class="texto--explicativo">
    SMAE gera um conjunto de 2 planilhas contendo os indicadores da meta e de
    seus desdobramentos e valores das variáveis regionalizadas. A versão
    analítica retorna todos os valores das séries e a consolidada somente os
    valores consolidados do final de cada semestre/ano
  </p> -->

  <TabelaDeSemestraisOuAnuais class="mb1" />

  <BotãoParaCarregarMais :fonte="fonte" />
</template>

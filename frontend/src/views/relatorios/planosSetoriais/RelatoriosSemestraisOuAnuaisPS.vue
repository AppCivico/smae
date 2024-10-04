<script setup>
import BotãoParaCarregarMais from '@/components/relatorios/BotaoParaCarregarMais.vue';
import TabelaDeSemestraisOuAnuais from '@/components/relatorios/TabelaDeSemestraisOuAnuais.vue';
import { useAuthStore } from '@/stores/auth.store';
import { useRelatoriosStore } from '@/stores/relatorios.store.ts';
import { storeToRefs } from 'pinia';

const { temPermissãoPara } = storeToRefs(useAuthStore());
const relatóriosStore = useRelatoriosStore();
const fonte = 'PSIndicadores';

relatóriosStore.$reset();
relatóriosStore.getAll({ fonte });
</script>
<template>
  <div class="flex spacebetween center mb2">
    <h1>{{ $route.meta.título }}</h1>
    <hr class="ml2 f1">
    <router-link
      v-if="temPermissãoPara('Reports.executar.')"
      :to="{ name: 'planoSetorial.novoRelatórioSemestralOuAnual' }"
      class="btn big ml2"
    >
      Novo relatório
    </router-link>
  </div>

  <p class="texto--explicativo">
    SMAE gera um conjunto de 2 planilhas contendo os indicadores da meta e de
    seus desdobramentos e valores das variáveis regionalizadas. A versão
    analítica retorna todos os valores das séries, desde o inicio da medição até
    o periodo informado, e a consolidada somente os valores consolidados do
    final de cada semestre/ano.
  </p>

  <TabelaDeSemestraisOuAnuais class="mb1" />

  <BotãoParaCarregarMais :fonte="fonte" />
</template>

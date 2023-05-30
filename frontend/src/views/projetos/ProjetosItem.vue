<script setup>
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const tarefasStore = useTarefasStore();
const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

async function iniciar() {
  if (projetosStore.emFoco?.id !== props.projetoId) {
    // Tarefas dependem do projeto, portanto precisam ser redefinidas na troca deste
    tarefasStore.$reset();
    projetosStore.$reset();

    await projetosStore.buscarItem(props.projetoId);
  }

  const portfolioId = projetosStore?.emFoco?.portfolio_id;

  if (!portfolioStore?.portfoliosPorId[portfolioId]) {
    await portfolioStore.buscarTudo();
  }
}

iniciar();
</script>
<script>
// use normal <script> to declare options
export default {
  inheritAttrs: false,
};
</script>
<template>
  <div class="t12 uc w700 tamarelo">
    <small class="lc">Portfolio</small>
    {{ portfolioStore.portfoliosPorId[projetosStore?.emFoco?.portfolio_id]?.titulo }}
  </div>

  <router-view />
</template>

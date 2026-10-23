<script setup>
import { storeToRefs } from 'pinia';
import { onUnmounted, watch } from 'vue';

import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { usePortfolioStore } from '@/stores/portfolios.store.ts';
import { useProjetosStore } from '@/stores/projetos.store.ts';
import { useRegionsStore } from '@/stores/regions.store';
import { useTarefasStore } from '@/stores/tarefas.store.ts';

const DotaçãoStore = useDotaçãoStore();
const portfolioStore = usePortfolioStore();
const projetosStore = useProjetosStore();
const RegionsStore = useRegionsStore();
const tarefasStore = useTarefasStore();

// Não repassar os `$attrs` ao `<router-view>`: a rota envia todos os parâmetros da
// URL, inclusive os das rotas filhas (ex.: `tarefaId`, ainda como string), mas só
// `projetoId` é declarado aqui. Se herdados, os demais chegariam à rota filha por
// cima das props que ela mesma calcula. Pior: quando somem (ex.: de `tarefas/20678`
// para `tarefas/nova`), o Vue não atualiza o `<router-view>`, e o valor antigo fica
// preso. Cada rota filha já recebe os parâmetros pelas próprias `props`, então não
// há o que repassar daqui.
defineOptions({ inheritAttrs: false });

const props = defineProps({
  projetoId: {
    type: Number,
    default: 0,
  },
});

const { DotaçãoSegmentos } = storeToRefs(DotaçãoStore);
const { emFoco } = storeToRefs(projetosStore);
const { regions } = storeToRefs(RegionsStore);

// eslint-disable-next-line padded-blocks
async function iniciar() {
  // eslint-disable-next-line padded-blocks
  if (emFoco?.id !== props.projetoId) {
    // Tarefas dependem do projeto, portanto precisam ser redefinidas na troca deste
    tarefasStore.$reset();
    projetosStore.$reset();

    await projetosStore.buscarItem(props.projetoId);
  }

  const portfolioId = emFoco?.portfolio_id;

  if (!Array.isArray(regions) || !regions.length) {
    RegionsStore.getAll();
  }

  if (!portfolioStore?.portfoliosPorId[portfolioId]) {
    portfolioStore.buscarTudo();
  }
}

watch(emFoco, () => {
  if (Array.isArray(emFoco?.value?.fonte_recursos)) {
    emFoco.value.fonte_recursos.forEach((fonte) => {
      if (fonte.fonte_recurso_ano) {
        if (!Array.isArray(DotaçãoSegmentos?.value?.[fonte.fonte_recurso_ano]?.fonte_recursos)) {
          DotaçãoStore.getDotaçãoSegmentos(fonte.fonte_recurso_ano);
        }
      }
    });
  }
});

iniciar();

onUnmounted(() => {
  portfolioStore.$reset();
  projetosStore.$reset();
  RegionsStore.$reset();
  tarefasStore.$reset();
});
</script>
<template>
  <router-view />
</template>

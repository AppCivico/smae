<script setup>
import { useDotaçãoStore } from '@/stores/dotacao.store.ts';
import { useObrasStore } from '@/stores/obras.store';
import { usePortfolioObraStore } from '@/stores/portfoliosMdo.store.ts';
import { useRegionsStore } from '@/stores/regions.store';
import { useTarefasStore } from '@/stores/tarefas.store.ts';
import { storeToRefs } from 'pinia';
import { onUnmounted, watch } from 'vue';

const DotaçãoStore = useDotaçãoStore();
const portfolioMdoStore = usePortfolioObraStore();
const obrasStore = useObrasStore();
const RegionsStore = useRegionsStore();
const tarefasStore = useTarefasStore();

const props = defineProps({
  obraId: {
    type: Number,
    default: 0,
  },
});

const { DotaçãoSegmentos } = storeToRefs(DotaçãoStore);
const { emFoco } = storeToRefs(obrasStore);
const { regions } = storeToRefs(RegionsStore);

// eslint-disable-next-line padded-blocks
async function iniciar() {
  // eslint-disable-next-line padded-blocks
  if (emFoco?.id !== Number(props.obraId)) {
    // Tarefas dependem do projeto, portanto precisam ser redefinidas na troca deste
    tarefasStore.$reset();
    obrasStore.$reset();

    await obrasStore.buscarItem(props.obraId);
  }

  const portfolioId = emFoco?.portfolio_id;

  if (!Array.isArray(regions) || !regions.length) {
    RegionsStore.getAll();
  }

  if (!portfolioMdoStore?.portfoliosPorId[portfolioId]) {
    portfolioMdoStore.buscarTudo();
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
  portfolioMdoStore.$reset();
  obrasStore.$reset();
  RegionsStore.$reset();
  tarefasStore.$reset();
});
</script>
<template>
  <router-view />
</template>

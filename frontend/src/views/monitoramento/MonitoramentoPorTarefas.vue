<script setup>
import LegendaDeTarefas from '@/components/monitoramento/LegendaDeTarefas.vue';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import ListaDeCronogramas from '@/components/monitoramento/ListaDeCronogramas.vue';
import { usePdMStore } from '@/stores/pdm.store';
import { storeToRefs } from 'pinia';

const panoramaStore = usePanoramaStore();
const {
  tarefasPorId,
  ancestraisPorEtapa,
} = storeToRefs(panoramaStore);

const PdMStore = usePdMStore();
const { activePdm } = storeToRefs(PdMStore);

async function iniciar() {
  if (!activePdm.value.id) {
    await PdMStore.getActive();
  }

  await panoramaStore.buscarTudo(activePdm.value.id, 'pendentes', {
    retornar_detalhes: true,
  });

  const tarefasCujosAncestraisBuscar = Object.keys(tarefasPorId.value)
    .filter((x) => !ancestraisPorEtapa.value[x]);
  console.debug('tarefasCujosAncestraisBuscar', tarefasCujosAncestraisBuscar);
  if (tarefasCujosAncestraisBuscar.length < 300) {
    panoramaStore.buscarAncestraisDeEtapas(tarefasCujosAncestraisBuscar);
  } else {
    panoramaStore.buscarAncestraisDeEtapas();
  }
}
iniciar();
</script>
<template>
  <LegendaDeTarefas class="legenda legenda--tarefas mb2" />

  <ListaDeCronogramas />
</template>

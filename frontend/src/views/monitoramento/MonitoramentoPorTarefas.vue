<script setup>
import { storeToRefs } from 'pinia';

import LegendaDeTarefas from '@/components/monitoramento/LegendaDeTarefas.vue';
import ListaDeCronogramas from '@/components/monitoramento/ListaDeCronogramas.vue';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import { usePdMStore } from '@/stores/pdm.store';

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
    filtro_ponto_focal_cronograma: true,
    filtro_ponto_focal_variavel: false,
  });

  const tarefasCujosAncestraisBuscar = Object.keys(tarefasPorId.value)
    .filter((x) => !ancestraisPorEtapa.value[x]);

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

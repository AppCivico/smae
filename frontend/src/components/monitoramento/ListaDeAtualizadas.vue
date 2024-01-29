<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { usePanoramaStore } from '@/stores/panorama.store.ts';
import truncate from '@/helpers/truncate';

const panoramaStore = usePanoramaStore();
const {
  perfil,
  variáveisPorId,
} = storeToRefs(panoramaStore);

//  atualizadas
//    ponto focal:
//      - todas as conferidas
//    para os outros:
//      - todas as enviadas
const listaDeAtualizadas = computed(() => {
  if (!perfil.value) return [];

  const aUsar = perfil.value === 'ponto_focal'
    ? 'conferidas'
    : 'enviadas';
  return panoramaStore.listaDeAtualizadas.map((x) => ({
    id: x.id,
    código: x.codigo,
    título: x.titulo,
    variáveis: x.variaveis?.[aUsar]?.map((y) => ({
      id: y,
      código: variáveisPorId.value[y]?.codigo || '',
      título: variáveisPorId.value[y]?.titulo || '',
      aguardaComplementação: x.variaveis.aguardando_complementacao.includes(y),
      aguardaConferência: x.variaveis.conferidas.includes(y),
      aguardaEnvio: x.variaveis.enviadas.includes(y),
      aguardaPreenchimento: x.variaveis.preenchidas.includes(y),
    }))
      .sort((a, b) => a.código.localeCompare(b.código)),
  }));
});
</script>
<template>
  <ul>
    <li
      v-for="meta in listaDeAtualizadas"
      :key="meta.id"
    >
      {{ meta.código }} - {{ meta.título }}
      <ul
        v-if="meta.variáveis.length"
      >
        <li
          v-for="variável in meta.variáveis"
          :key="variável.id"
          :title="variável.título?.length > 36
            ? variável.título
            : undefined"
          class="ml2"
        >
          {{ variável.código || variável.id }} - {{
            truncate(variável.título, 36) }}

          <small>
            (<code>aguardaComplementação:&nbsp;{{ variável.aguardaComplementação }}</code>)
            (<code>aguardaConferência:&nbsp;{{ variável.aguardaConferência }}</code>)
            (<code>aguardaEnvio:&nbsp;{{ variável.aguardaEnvio }}</code>)
            (<code>aguardaPreenchimento:&nbsp;{{ variável.aguardaPreenchimento }}</code>)
          </small>
        </li>
      </ul>
    </li>
  </ul>
</template>

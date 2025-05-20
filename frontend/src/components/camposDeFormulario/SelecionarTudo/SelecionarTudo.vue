<template>
  <input
    type="checkbox"
    class="like-a__text"
    :indeterminate.prop="selecaoEstaParcial"
    :checked="selecaoEstaCompleta"
    :title="selecaoEstaCompleta
      ? 'Desconsiderar todas as opções na página'
      : 'Selecionar todas as opções na página'"
    @change="alternarSelecao(!selecaoEstaCompleta)"
  >
</template>
<script setup lang="ts">
import { computed } from 'vue';

const model = defineModel<Array<unknown>>();

const props = defineProps({
  listaDeOpcoes: {
    type: Array,
    required: true,
  },
});

// aqyu
const conjuntoDeSelecionados = computed(() => (Array.isArray(model.value)
  ? new Set(model.value)
  : new Set()));

const conjuntoDeOpcoes = computed(() => new Set(props.listaDeOpcoes));

const conjuntoDeDesselecionados = computed(() => conjuntoDeOpcoes
  .value.difference(conjuntoDeSelecionados.value));

const selecaoEstaCompleta = computed(() => !conjuntoDeDesselecionados.value.size);

const selecaoEstaParcial = computed(() => conjuntoDeDesselecionados.value.size
  && conjuntoDeDesselecionados.value.size < conjuntoDeOpcoes.value.size);

function alternarSelecao(selecionar: boolean) {
  if (selecionar) {
    model.value = Array.from(conjuntoDeSelecionados.value.union(conjuntoDeOpcoes.value));
  } else {
    model.value = Array.from(conjuntoDeSelecionados.value.difference(conjuntoDeOpcoes.value));
  }
}
</script>

<template>
  <header class="flex spacebetween center mb2">
    <TituloDaPagina />

    <hr class="ml2 f1">

    <slot name="acoes" />

    <CheckClose
      v-if="$route.meta.rotaDeEscape"
      :formulario-sujo="$props.formularioSujo"
    />
  </header>
</template>
<script setup lang="ts">
defineProps({
  formularioSujo: {
    type: Boolean,
    default: false,
  },
});
</script>

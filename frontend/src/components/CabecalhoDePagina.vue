<template>
  <header class="flex spacebetween center g2 mb2">
    <TítuloDePágina id="titulo-da-pagina">
      <slot name="titulo" />
    </TítuloDePágina>

    <hr class="f1">

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

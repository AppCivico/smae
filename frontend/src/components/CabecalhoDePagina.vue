<template>
  <slot name="migalhas-de-pao">
    <MigalhasDePao class="mb1" />
  </slot>

  <header
    class="flex spacebetween center g2 mb2 cabecalho"
    v-bind="$attrs"
  >
    <TituloDePagina id="titulo-da-pagina">
      <slot name="titulo" />
    </TituloDePagina>

    <hr class="f1">

    <slot name="acoes" />

    <CheckClose
      v-if="$route.meta.rotaDeEscape"
      :formulario-sujo="$props.formularioSujo"
    />
  </header>
</template>
<script setup lang="ts">
defineOptions({
  inheritAttrs: false,
});

defineProps({
  formularioSujo: {
    type: Boolean,
    default: false,
  },
});
</script>
<style scoped lang="less">
.cabecalho > {
  * {
    max-width: max-content;
    width: fit-content;
    flex-grow: 1;
  }

  h1 {
    text-wrap: balance;
  }

  hr {
    flex-grow: 1;
    max-width: none;
    width: auto;
  }

  :deep(.botao-de-fechamento) {
    // Por causa de código legado. Tomara que removamos um dia
    margin-left: 0 !important;
  }
}
</style>

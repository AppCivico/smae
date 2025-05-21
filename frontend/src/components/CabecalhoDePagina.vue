<template>
  <header
    class="flex flexwrap spacebetween center g2 mb2 cabecalho"
    v-bind="$attrs"
  >
    <p
      v-if="!!$route.meta.subtitulo || !!$slots.subtitulo?.()"
      role="doc-subtitle"
      class="t12 uc w700 tamarelo"
    >
      <slot name="subtitulo">
        {{ $route.meta.subtitulo }}
      </slot>
    </p>

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
  :deep(*) {
    max-width: fit-content;
    width: fit-content;
    flex-grow: 1;
  }

  [role="doc-subtitle"] {
    flex-basis: 100%;
    max-width: 100%;
    width: 100%;
    margin: 0;
  }

  :deep(h1) {
    flex-basis: min-content;
  }

  hr {
    max-width: none;
    width: auto;
    flex-basis: 1%;
  }

  :deep(.botao-de-fechamento) {
    min-width: calc(3em + 4px);
    // Por causa de código legado. Tomara que removamos um dia
    margin-left: 0 !important;
  }
}
</style>

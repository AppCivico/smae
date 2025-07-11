<template>
  <div class="texto-com-botao">
    <div class="texto-com-botao__texto">
      <slot name="texto" />
    </div>

    <div
      v-if="$slots['botao']"
      class="texto-com-botao__botao"
    >
      <slot name="botao" />
    </div>
  </div>
</template>
<style lang="less" scoped>
.texto-com-botao {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 1.5rem;

  &:has(.texto-com-botao__botao) {
    &::after {
      content: '';
      flex-grow: 1;
      min-width: 2rem;
      height: 2px;
      background-color: @cinza-claro;
    }
  }
}
.texto-com-botao__botao {
  order: 3;
}
</style>

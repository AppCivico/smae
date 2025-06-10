<template>
  <div class="texto-com-botao">
    <div class="texto-com-botao__texto">
      <slot name="texto" />
    </div>
    <div class="texto-com-botao__botao">
      <slot name="botao" />
    </div>
  </div>
</template>
<style lang="less" scoped>
.texto-com-botao {
  display: flex;
  flex-wrap: wrap;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 1.5rem;

  &::after {
    content: '';
    flex-grow: 1;
    /* width: 100%; */
    min-width: 2rem;
    height: 2px;
    background-color: @cinza-claro;
  }
}
.texto-com-botao__botao {
  order: 3;
}
</style>

<template>
  <div class="layout-publico">
    <div class="layout-publico__conteudo">
      <RouterView />
    </div>
  </div>
</template>

<style lang="less" scoped>
@import '@/_less/variables.less';

.layout-publico {
  min-height: 100vh;
  background-color: @branco;
}

.layout-publico__conteudo {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
}
</style>

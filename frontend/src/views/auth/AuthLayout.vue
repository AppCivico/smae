<template>
  <div class="login">
    <div class="login-form">
      <div class="wrap flex column spacebetween">
        <div>
          <img
            src="@/assets/logo.svg"
            alt="SMAE"
          >
          <p class="tamarelo">
            Sistema de Monitoramento e Acompanhamento Estratégico
          </p>
        </div>

        <RouterView />

        <div class="logos flex center justifycenter bgb p05">
          <img
            class="logos__sp-imagem mr1"
            src="@/assets/sp.png"
          >
          <img
            class="logos__fgv-imagem"
            src="@/assets/fgv-projetos.jpg"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.logos__sp-imagem {
  width: 6rem;
  height: 100%;
}

.logos__fgv-imagem {
  width: 10rem;
  height: 100%;
}
</style>

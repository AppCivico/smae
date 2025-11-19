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

        <div class="logos flex center justifycenter p05">
          <img
            class="logos__sp-imagem mr1"
            src="@/assets/sp-branco.png"
          >

          <img
            class="logos__fgv-imagem"
            src="@/assets/fgv-projetos-branco.png"
          >
        </div>
      </div>
    </div>
  </div>
</template>

<style lang="less" scoped>
.logos__sp-imagem {
  width: 8rem;
}

.logos__fgv-imagem {
  width: 11rem;
}
</style>

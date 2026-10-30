<script setup lang="ts">
defineProps<{
  titulo: string;
  rodape?: string;
  semFundo?: boolean;
}>();
</script>

<template>
  <section
    class="painel-cartao"
  >
    <header class="painel-cartao__cabecalho">
      <h3 class="painel-cartao__titulo">
        {{ titulo }}
      </h3>

      <hr class="painel-cartao__linha">
    </header>

    <div class="painel-cartao__conteudo">
      <slot />
    </div>

    <p
      v-if="rodape"
      class="painel-cartao__rodape"
    >
      {{ rodape }}
    </p>
  </section>
</template>

<style scoped lang="less">
.painel-cartao {
  display: flex;
  flex-direction: column;
  padding: 17px 32px 20px;
  border-radius: 12px;
}

.painel-cartao__cabecalho {
  display: flex;
  align-items: center;
  gap: 16px;
}

.painel-cartao__titulo {
  margin: 0;
  font-size: 25px;
  font-weight: 600;
  line-height: 28px;
  color: @primary;
}

.painel-cartao__linha {
  flex-grow: 1;
  margin: 0;
  border: 0;
  border-top: 0.94px solid @c500;
}

.painel-cartao__conteudo {
  flex-grow: 1;
}

.painel-cartao__rodape {
  position: relative;
  margin: 0 auto;
  padding-top: 10px;
  max-width: 410px;
  font-size: 12.07px;
  font-weight: 600;
  line-height: 1.04;
  text-align: center;
  color: #7e858d;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 120.75px;
    border-top: 0.6px solid #7e858d;
    transform: translateX(-50%);
  }
}
</style>

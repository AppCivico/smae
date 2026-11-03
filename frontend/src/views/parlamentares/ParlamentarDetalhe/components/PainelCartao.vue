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
    </header>

    <div class="painel-cartao__conteudo">
      <slot />
    </div>

    <footer
      v-if="rodape"
      class="painel-cartao__rodape"
    >
      {{ rodape }}
    </footer>
  </section>
</template>

<style scoped lang="less">
.painel-cartao {
  display: flex;
  flex-direction: column;
  padding: 1.2rem 2.3rem 1.4rem;
  border-radius: 0.9rem;
}

.painel-cartao__cabecalho {
  display: flex;
  align-items: center;
  gap: 1.1rem;
}

.painel-cartao__titulo {
  margin: 0;
  font-size: 1.8rem;
  font-weight: 600;
  line-height: 2rem;
  color: @primary;
}

.painel-cartao__cabecalho::after {
  content: '';
  flex-grow: 1;
  margin: 0;
  border: 0;
  border-top: 0.1rem solid @c500;
}

.painel-cartao__conteudo {
  flex-grow: 1;
}

.painel-cartao__rodape {
  position: relative;
  margin: 0 auto;
  padding-top: 0.7rem;
  max-width: 29.3rem;
  font-size: 0.9rem;
  font-weight: 600;
  line-height: 1.04;
  text-align: center;
  color: #7e858d;

  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 50%;
    width: 8.6rem;
    border-top: 0.1rem solid #7e858d;
    transform: translateX(-50%);
  }
}
</style>

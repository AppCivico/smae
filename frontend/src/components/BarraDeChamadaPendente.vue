<template>
  <Teleport
    to="body"
  >
    <div
      class="barra-de-pendencia__envelope"
      :class="{
        'barra-de-pendencia__envelope--pendente': estáPendente,
        'barra-de-pendencia__envelope--visível': estáVisível
      }"
    />
  </Teleport>
</template>
<script setup>
// @see: https://stackabuse.com/lazy-loading-routes-with-vue-router/
import {
  nextTick, onBeforeUnmount, onMounted, ref,
} from 'vue';
import $eventHub from './eventHub';

const estáPendente = ref(true);
const estáVisível = ref(false);

const start = async () => {
  estáVisível.value = true;
  await nextTick();
  estáPendente.value = true;
};

const stop = () => {
  estáPendente.value = false;

  setTimeout(() => {
    if (!estáPendente.value) {
      estáVisível.value = false;
    }
  }, 200);
};

onMounted(() => {
  $eventHub.on('chamadaPendenteIniciada', start);
  $eventHub.on('chamadaPendenteEncerrada', stop);
});

onBeforeUnmount(() => {
  $eventHub.off('chamadaPendenteIniciada', start);
  $eventHub.off('chamadaPendenteEncerrada', stop);
});
</script>
<style lang="less" scoped>
.barra-de-pendencia__envelope {
  position: fixed;
  top: 0;
  left: 0;
  height: 3px;
  width: 100%;
  opacity: 0;
  z-index: 1000;
  display: none;
  transition: opacity 200ms;
  pointer-events: none;
}

.barra-de-pendencia__envelope.barra-de-pendencia__envelope--visível {
  background-color: @amarelo;
  display: block;

  &::before {
    content: '';
    display: block;
    animation: animacao-de-pendencia 2s ease-in infinite;
    background-image: linear-gradient(to right, @amarelo, @primary, @amarelo);
    height: 100%;
  }
}

.barra-de-pendencia__envelope.barra-de-pendencia__envelope--pendente {
  opacity: 1;
}

@keyframes animacao-de-pendencia {
  0% {
    margin-left: 0;
    width: 0;
  }

  50% {
    width: 50%;
  }

  100% {
    width: 0;
    margin-left: 100%;
  }
}
</style>

<template>
  <Teleport
    to="body"
  >
    <div
      class="barra-de-pendencia__envelope"
      :class="{
        'barra-de-pendencia__envelope--recebimento-pendente': recebimentoPendente,
        'barra-de-pendencia__envelope--recebimento-visível': recebimentoVisível,
        'barra-de-pendencia__envelope--envio-pendente': envioPendente,
        'barra-de-pendencia__envelope--envio-visível': envioVisível
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

const envioPendente = ref(true);
const envioVisível = ref(false);
const recebimentoPendente = ref(true);
const recebimentoVisível = ref(false);

const iniciarEnvio = async () => {
  envioVisível.value = true;
  await nextTick();
  envioPendente.value = true;
};
const encerrarEnvio = () => {
  envioPendente.value = false;

  setTimeout(() => {
    if (!envioPendente.value) {
      envioVisível.value = false;
    }
  }, 200);
};

const iniciarRecebimento = async () => {
  recebimentoVisível.value = true;
  await nextTick();
  recebimentoPendente.value = true;
};
const encerrarRecebimento = () => {
  recebimentoPendente.value = false;

  setTimeout(() => {
    if (!recebimentoPendente.value) {
      recebimentoVisível.value = false;
    }
  }, 200);
};

onMounted(() => {
  $eventHub.on('envioIniciado', iniciarEnvio);
  $eventHub.on('envioEncerrado', encerrarEnvio);
  $eventHub.on('recebimentoIniciado', iniciarRecebimento);
  $eventHub.on('recebimentoEncerrado', encerrarRecebimento);
});

onBeforeUnmount(() => {
  $eventHub.off('envioIniciado', iniciarEnvio);
  $eventHub.off('envioEncerrado', encerrarEnvio);
  $eventHub.off('recebimentoIniciado', iniciarRecebimento);
  $eventHub.off('recebimentoEncerrado', encerrarRecebimento);
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

.barra-de-pendencia__envelope.barra-de-pendencia__envelope--recebimento-visível,
.barra-de-pendencia__envelope.barra-de-pendencia__envelope--envio-visível {
  background-color: @amarelo;
  display: block;

  &::before,
  &::after {
    @transparent: fadeout(@primary, 100%);

    position: absolute;
    top: 0;
    bottom: 0;
    display: block;
    background-image: linear-gradient(to right, @transparent, @primary, @transparent);
    height: 100%;
  }
}

.barra-de-pendencia__envelope.barra-de-pendencia__envelope--recebimento-visível {
  &::before {
    content: '';
    animation: animacao-de-recebimento-pendente 2s ease-in infinite;
  }
}

.barra-de-pendencia__envelope.barra-de-pendencia__envelope--envio-visível {
  &::after {
    content: '';
    animation: animacao-de-envio-pendente 2s ease-in infinite;
  }
}

.barra-de-pendencia__envelope.barra-de-pendencia__envelope--recebimento-pendente,
.barra-de-pendencia__envelope.barra-de-pendencia__envelope--envio-pendente {
  opacity: 1;
}

@keyframes animacao-de-recebimento-pendente {
  0% {
    right: 0;
    width: 0;
  }

  50% {
    width: 50%;
  }

  100% {
    width: 0;
    right: 100%;
  }
}

@keyframes animacao-de-envio-pendente {
  0% {
    left: 0;
    width: 0;
  }

  50% {
    width: 50%;
  }

  100% {
    width: 0;
    left: 100%;
  }
}
</style>

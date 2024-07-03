<template>
  <form
    action=""
    method="get"
    @submit.prevent="aplicarFiltros"
    class="formulario-query-string flex flexwrap g2 mb2 fb100"
  >
    <slot />

    <button
      v-if="!ocultarBotaoDeEnvio"
      type="submit"
      class="btn outline bgnone tcprimary mtauto align-end mlauto mr0"
    >
      {{ etiquetaParaBotaoDeEnvio }}
    </button>
  </form>
</template>
<script setup lang="ts">
import { UrlParams } from '@vueuse/core';
import { pick } from 'lodash';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits(['enviado', 'montado']);

const route = useRoute();
const router = useRouter();

const props = defineProps({
  etiquetaParaBotaoDeEnvio: {
    type: String,
    default: 'Filtrar',
  },
  ocultarBotaoDeEnvio: {
    type: Boolean,
    default: false,
  },
  valoresPadrao: {
    type: Object,
    default: () => ({
    }),
  },
});

function aplicarFiltros(event: Event): void {
  const formulario: HTMLFormElement | null = event.target as HTMLFormElement;
  let parametros: UrlParams = {};

  if (!formulario) return;

  let i = 0;

  while (formulario.elements[i]) {
    const campo = formulario.elements[i] as HTMLInputElement;

    if (campo.value) {
      if (parametros[campo.name]) {
        if (!Array.isArray(parametros[campo.name])) {
          parametros[campo.name] = [String(parametros[campo.name])];
        }

        (parametros[campo.name] as Array<string>).push(String(campo.value));
      } else {
        parametros[campo.name] = campo.value
          || props.valoresPadrao[campo.name];
      }
    } else {
      parametros[campo.name] = props.valoresPadrao[campo.name];
    }

    i += 1;
  }

  parametros = {
    ...route.query,
    ...props.valoresPadrao,
    ...parametros,
  };

  parametros = pick(parametros, Object.keys(parametros).sort());

  emit('enviado', parametros);

  router.replace({
    query: parametros
  });
}

onMounted(() => {
  let parametrosCombinados = {
    ...props.valoresPadrao,
    ...route.query,
  };

  parametrosCombinados = pick(parametrosCombinados, Object.keys(parametrosCombinados).sort());

  emit('montado', parametrosCombinados);

  router.replace({
    query: parametrosCombinados
  });
});
</script>
<style lang="less">
.formulario-query-string {}
.formulario-query-string .label {
  color: @c300;
}
</style>

<template>
  <slot
    class="formulario-query-string"
    :capturar-envio="aplicarFiltros"
  />
</template>
<script setup lang="ts">
import EnvioParaObjeto from '@/helpers/EnvioParaObjeto.ts';
import { UrlParams } from '@vueuse/core';
import { pick } from 'lodash';
import { onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const emit = defineEmits(['aplicado', 'montado']);

const route = useRoute();
const router = useRouter();

const props = defineProps({
  valoresIniciais: {
    type: Object,
    default: () => ({}),
  },
});

function aplicarFiltros(evento: SubmitEvent): void {
  const campos = EnvioParaObjeto(evento);
  const nomesDosCampos = Object.keys(campos);

  let parametros: UrlParams = {};

  let i = 0;

  while (nomesDosCampos[i]) {
    const nomeDoCampo = nomesDosCampos[i];
    const valor = campos[nomeDoCampo];

    if (valor) {
      if (parametros[nomeDoCampo]) {
        if (!Array.isArray(parametros[nomeDoCampo])) {
          parametros[nomeDoCampo] = [String(parametros[nomeDoCampo])];
        }

        (parametros[nomeDoCampo] as Array<string>).push(String(valor));
      } else {
        parametros[nomeDoCampo] = valor
          || props.valoresIniciais[nomeDoCampo];
      }
    } else if (valor === '') {
      parametros[nomeDoCampo] = '';
    } else {
      parametros[nomeDoCampo] = props.valoresIniciais[nomeDoCampo];
    }

    i += 1;
  }

  parametros = {
    ...route.query,
    ...props.valoresIniciais,
    ...parametros,
  };

  parametros = pick(parametros, Object.keys(parametros).sort());

  emit('aplicado', parametros);

  router.replace({
    query: parametros,
  });
}

onMounted(() => {
  let parametrosCombinados = {
    ...props.valoresIniciais,
    ...route.query,
  };

  parametrosCombinados = pick(parametrosCombinados, Object.keys(parametrosCombinados).sort());

  emit('montado', parametrosCombinados);

  router.replace({
    query: parametrosCombinados,
  });
});
</script>

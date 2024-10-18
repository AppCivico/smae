<template>
  <slot
    :aplicar-query-strings="aplicarFiltros"
  />
</template>
<script setup lang="ts">
import EnvioParaObjeto from '@/helpers/EnvioParaObjeto';
import type { UrlParams } from '@vueuse/core';
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

function aplicarFiltros(eventoOuObjeto: SubmitEvent | Record<string, unknown>): void {
  let parametros: UrlParams = {};

  if (eventoOuObjeto instanceof SubmitEvent) {
    const campos = EnvioParaObjeto(eventoOuObjeto);

    const nomesDosCampos = Object.keys(campos);
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
  } else {
    parametros = eventoOuObjeto as UrlParams;
  }

  parametros = {
    ...route.query,
    ...parametros,
  };

  // Remover propriedades com valores de string vazia
  Object.keys(parametros).forEach((key) => {
    if (parametros[key] === '') {
      delete parametros[key];
    }
  });

  // Ordenar os parâmetros
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

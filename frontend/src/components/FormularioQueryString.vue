<template>
  <slot
    :aplicar-query-strings="aplicarFiltros"
    :detectar-mudancas="detectarMudancas"
    :formulario-sujo="!!camposSujos.length"
  />
</template>
<script setup lang="ts">
import decodificadorDePrimitivas from '@/helpers/decodificadorDePrimitivas';
import EnvioParaObjeto from '@/helpers/EnvioParaObjeto';
import type { UrlParams } from '@vueuse/core';
import { cloneDeep, isEqualWith, pick } from 'lodash';
import { onMounted, ref } from 'vue';
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

const camposSujos = ref<string[]>([]);

function comparadorSimples(campo: unknown, parametro: unknown) {
  // eslint-disable-next-line eqeqeq
  return campo == parametro
    || decodificadorDePrimitivas(String(campo)) === decodificadorDePrimitivas(String(parametro))
    || (
      campo === '' && parametro === undefined
    )
    || (
      (Array.isArray(campo) && !campo.length)
      && (parametro === undefined || !(parametro as string)?.length)
    )
    || undefined;
}

function detectarMudancas(eventoOuObjeto: Event | Record<string, unknown>): void {
  let chaveValor: Record<string, unknown> = {};

  if (eventoOuObjeto instanceof Event) {
    if ((eventoOuObjeto.target as HTMLInputElement)?.name) {
      chaveValor = {
        [(eventoOuObjeto.target as HTMLInputElement).name as string]: (eventoOuObjeto.target as HTMLInputElement).value ?? '',
      };
    }
  } else {
    chaveValor = eventoOuObjeto;
  }

  if (Object.keys(chaveValor).length) {
    Object.keys(chaveValor).forEach((chave) => {
      if (!isEqualWith(chaveValor[chave], route.query[chave], comparadorSimples)) {
        if (!camposSujos.value.includes(chave)) {
          camposSujos.value.push(chave);
        }
      } else {
        const index = camposSujos.value.indexOf(chave);

        if (index > -1) {
          camposSujos.value.splice(index, 1);
        }
      }
    });
  }
}

function aplicarFiltros(eventoOuObjeto: SubmitEvent | Record<string, unknown>): Promise<void> {
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
    ...cloneDeep(route.query),
    ...cloneDeep(parametros),
  } as UrlParams;

  // Remover propriedades com valores de string vazia
  Object.keys(parametros).forEach((key) => {
    if (parametros[key] === '') {
      delete parametros[key];
    }
  });

  // Ordenar os parâmetros
  parametros = pick(parametros, Object.keys(parametros).sort());

  return router.replace({
    query: parametros,
  }).then(() => {
    emit('aplicado', parametros);

    detectarMudancas(eventoOuObjeto);
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

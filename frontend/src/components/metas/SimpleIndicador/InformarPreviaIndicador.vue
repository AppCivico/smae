<script lang="ts" setup>
// eslint-disable-next-line import/extensions
import { IndicadorDto } from '@back/indicador/entities/indicador.entity';
// eslint-disable-next-line import/extensions
import type { ListSeriesAgrupadas } from '@back/variavel/dto/list-variavel.dto';
import { computed } from 'vue';

import { dateToMonthYear } from '@/helpers/dateToDate';
import { useIndicadoresStore } from '@/stores/indicadores.store';

import InformarCategorica from './InformarPreviaIndicador/InformarCategorica.vue';
import InformarCategoricaRegionalizavel from './InformarPreviaIndicador/InformarCategoricaRegionalizavel.vue';
import InformarNumerica from './InformarPreviaIndicador/InformarNumerica.vue';

const indicadoresStore = useIndicadoresStore();

type Props = {
  indicador: IndicadorDto;
  valores: ListSeriesAgrupadas;
};

const props = defineProps<Props>();

async function enviarDados(dados: unknown) {
  await indicadoresStore.indicarPrevia(props.indicador.id, {
    referencia: props.valores.ultima_previa_indicador.referencia,
    ...dados,
  });
}

const variavelTipo = computed(() => {
  if (props.indicador.indicador_tipo === 'Numerico') {
    return 'numerico';
  }

  if (props.indicador.regionalizavel) {
    return 'categorica_regionalizavel';
  }

  return 'categorica';
});

const configuracaoPorTipo = computed(() => {
  const config = {
    numerico: {
      titulo: 'Informar qualificação prévia',
      componente: InformarNumerica,
    },
    categorica: {
      titulo: 'Informar valor prévio',
      componente: InformarCategoricaRegionalizavel,
    },
    categorica_regionalizavel: {
      titulo: 'Informar valor prévio',
      componente: InformarCategorica,
    },
  };

  return config[variavelTipo.value];
});

</script>

<template>
  <div class="modal-preenchimento-manual">
    <header class="modal-header">
      <h2>{{ configuracaoPorTipo.titulo }}</h2>
    </header>

    <div class="flex g2 mb2">
      <svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        color="#F2890D"
        xmlns="http://www.w3.org/2000/svg"
      >
        <use xlink:href="#i_indicador" />
      </svg>
      <div class="f1">
        <div class="t18 w700">
          {{ props.indicador.titulo }}
        </div>
        <div
          v-if="$props.valores.ultima_previa_indicador?.data_valor"
          class="t13 tc60"
        >
          Ciclo: {{ dateToMonthYear($props.valores.ultima_previa_indicador.data_valor) }}
        </div>
      </div>
    </div>

    <component
      :is="configuracaoPorTipo.componente"
      class="mt2"
      :indicador="props.indicador"
      :valores="props.valores"
      @submit="enviarDados"
    />
  </div>
</template>

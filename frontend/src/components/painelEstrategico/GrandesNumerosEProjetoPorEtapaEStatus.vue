<template>
  <div>
    <div class="flex flexwrap g2 justifycenter center pb2">
      <NumeroComLegenda
        :numero="grandesNumeros[0].total_projetos"
        cor="#221F43"
        legenda="Total de projetos"
        :tamanho-do-numero="tamanhoDoNúmeroPrimário"
        :tamanho-da-legenda="12"
      />

      <NumeroComLegenda
        :numero="grandesNumeros[0].total_orgaos"
        cor="#221F43"
        legenda="Total de órgãos"
        cor-de-fundo="#e8e8e866"
        :tamanho-do-numero="tamanhoDoNúmeroSecundário"
        :tamanho-da-legenda="12"
      />

      <NumeroComLegenda
        :numero="grandesNumeros[0].total_metas"
        cor="#221F43"
        legenda="Total de metas"
        cor-de-fundo="#e8e8e866"
        :tamanho-do-numero="tamanhoDoNúmeroSecundário"
        :tamanho-da-legenda="12"
      />
    </div>

    <Swiper
      :slides-per-wiew="1"
      :space-between="50"
      :pagination="{ clickable: true }"
      :modules="[
        Pagination,
      ]"
    >
      <SwiperSlide>
        <CardEnvelope.Titulo
          titulo="Projetos por Status"
        />

        <GraficoDashboard
          :option="chartOptions"
        />
      </SwiperSlide>

      <SwiperSlide>
        <CardEnvelope.Titulo
          titulo="Projetos por Etapas"
        />

        <GraficoDashboard
          :option="chartOptions"
        />
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup>
import { defineProps, computed } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';

import { Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

import NumeroComLegenda from '@/components/painelEstrategico/NumeroComLegenda.vue';
import GraficoDashboard from '@/components/graficos/GraficoDashboard.vue';
import * as CardEnvelope from '@/components/cardEnvelope';

const props = defineProps({
  grandesNumeros: {
    type: Object,
    required: true,
  },
  projetoEtapas: {
    type: Array,
    required: true,
  },
  projetoStatus: {
    type: Array,
    required: true,
  },
});

const etapas = computed(() => props.projetoEtapas.map((item) => item.etapa));
const quantidades = computed(() => props.projetoEtapas.map((item) => item.quantidade));

const tamanhoDoNúmeroPrimário = 100;
const tamanhoDoNúmeroSecundário = 80;

const chartOptions = computed(() => ({
  color: [
    '#1b263b',
    '#221f43',
    '#2e4059',
    '#778da9',
    '#5c7490',
    '#acb7c3',
    '#e0e1dd',
  ],
  tooltip: {
    trigger: 'item',
  },
  grid: {
    left: '0', // Ajuste o espaço à esquerda
    right: '50%', // Reserve mais espaço à direita para os labels
    bottom: '3%',
    containLabel: true,
  },
  xAxis: {
    type: 'value',
    inverse: true, // Inverter o eixo X para as barras crescerem da direita para a esquerda
    axisLabel: { show: false }, // Ocultar os labels do eixo X
    axisLine: { show: false }, // Ocultar a linha do eixo X
    axisTick: { show: false }, // Ocultar os ticks do eixo X
    splitLine: { show: false }, // Ocultar as linhas divisórias do eixo X
  },
  yAxis: {
    type: 'category',
    data: etapas.value,
    axisTick: {
      show: false,
    },
    axisLine: {
      show: false,
    },
    axisLabel: {
      show: false,
    },
  },
  series: [
    {
      type: 'bar',
      data: quantidades.value,
      barWidth: 35,
      colorBy: 'data',
      label: {
        show: true,
        position: 'right',
        formatter: (params) => {
          const label = etapas.value[params.dataIndex].toUpperCase(); // Usar o label das etapas
          const { value } = params;

          return `{number|${value}}\n{text|${label}}`;
        },
        rich: {
          number: {
            fontSize: 30,
            fontWeight: 'bold',
            color: (params) => params.color,
            align: 'left',
            padding: [0, 0, 0, 40],
          },
          text: {
            fontSize: 14,
            color: '#333',
            align: 'left',
            padding: [0, 0, 0, 40],
          },
        },
      },
      itemStyle: {
        borderRadius: [999, 0, 0, 999],
      },
      markLine: {
        label: {
          show: false,
        },
        symbol: 'none',
        lineStyle: {
          color: '#aaa',
          width: 1,
          type: 'solid',
        },
        data: [
          {
            xAxis: 0,
          },
        ],
      },
    },
  ],
}));
</script>

<style scoped>
</style>

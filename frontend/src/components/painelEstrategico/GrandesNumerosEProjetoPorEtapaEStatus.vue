<template>
  <div>
    <div class="flex flexwrap g2 justifycenter center pb2">
      <NumeroComLegenda
        :numero="grandesNumeros.total_projetos"
        cor="#221F43"
        legenda="Total de projetos"
        :tamanho-do-numero="tamanhoDoNúmeroPrimário"
        :tamanho-da-legenda="12"
      />

      <NumeroComLegenda
        :numero="grandesNumeros.total_orgaos"
        cor="#221F43"
        legenda="Total de órgãos"
        cor-de-fundo="#e8e8e866"
        :tamanho-do-numero="tamanhoDoNúmeroSecundário"
        :tamanho-da-legenda="12"
      />

      <NumeroComLegenda
        :numero="grandesNumeros.total_metas"
        cor="#221F43"
        legenda="Total de metas"
        cor-de-fundo="#e8e8e866"
        :tamanho-do-numero="tamanhoDoNúmeroSecundário"
        :tamanho-da-legenda="12"
      />
    </div>

    <Swiper
      class="pb4"
      :slides-per-wiew="1"
      :space-between="50"
      :pagination="{ clickable: true }"
      :modules="[
        Pagination,
      ]"
    >
      <SwiperSlide>
        <ProjetosPorStatus
          :projetos-por-status="projetoStatus"
        />
      </SwiperSlide>

      <SwiperSlide>
        <ProjetosPorEtapa
          :projetos-por-etapas="projetoEtapas"
        />
      </SwiperSlide>
    </Swiper>
  </div>
</template>

<script setup>
import { defineProps } from 'vue';
import { Swiper, SwiperSlide } from 'swiper/vue';
import { Pagination } from 'swiper/modules';

import 'swiper/css';
import 'swiper/css/pagination';

import NumeroComLegenda from '@/components/painelEstrategico/NumeroComLegenda.vue';
import ProjetosPorStatus from '@/components/painelEstrategico/ProjetosPorStatus.vue';
import ProjetosPorEtapa from '@/components/painelEstrategico/ProjetosPorEtapa.vue';

defineProps({
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

const tamanhoDoNúmeroPrimário = 100;
const tamanhoDoNúmeroSecundário = 80;
</script>

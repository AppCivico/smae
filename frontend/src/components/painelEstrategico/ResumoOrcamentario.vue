<script setup>
import { defineProps } from 'vue';
import dinheiro from '@/helpers/dinheiro';
import * as CardEnvelope from '../cardEnvelope/index.ts';

defineProps({
  planejadoTotal: {
    type: [String, Number],
    required: true,
  },
  empenhoTotal: {
    type: [String, Number],
    required: true,
  },
  liquidadoTotal: {
    type: [String, Number],
    required: true,
  },
});
</script>

<template>
  <CardEnvelope.Conteudo>
    <CardEnvelope.Titulo
      titulo="Resumo Orçamentário"
      subtitulo="Acompanhamento dos valores orçamentários totais."
      icone="moneyChart"
      cor="#D86B2C"
    />
    <div class="tr mt3 w700">
      <div class="pb1">
        <d class="mb0 t12 w700">
          CUSTO PLANEJADO TOTAL:
        </d>
        <dt class="mb0 t48 w700">
          R$ {{ dinheiro(Number(planejadoTotal)) }}
        </dt>
      </div>
      <div class="pb1">
        <d class="mb0 t12 w700">
          VALOR EMPENHADO TOTAL:
        </d>
        <dt class="mb0 t48 w700">
          R$ {{ dinheiro(Number(empenhoTotal)) }}
        </dt>
      </div>
      <div class="pb1">
        <d class="mb0 t12 w700">
          VALOR LIQUIDADO TOTAL:
        </d>
        <dt class="mb0 t48 w700 liquidado">
          R$ {{ dinheiro(Number(liquidadoTotal)) }}
        </dt>
      </div>
    </div>
  </CardEnvelope.Conteudo>
</template>

<style scoped lang="less">
    p{
        color: #7E858D;
    }

    .liquidado {
        color: #D86B2C;
    }
</style>

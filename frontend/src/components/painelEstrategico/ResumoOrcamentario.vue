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
    <dl class="tr mt3 w700">
      <div class="pb1">
        <dt class="mb0 t12 w700">
          CUSTO PLANEJADO TOTAL:
        </dt>
        <dd class="mb0 t48 w700">
          R$ {{ dinheiro(Number(planejadoTotal)) }}
        </dd>
      </div>
      <div class="pb1">
        <dt class="mb0 t12 w700">
          VALOR EMPENHADO TOTAL:
        </dt>
        <dd class="mb0 t48 w700">
          R$ {{ dinheiro(Number(empenhoTotal)) }}
        </dd>
      </div>
      <div class="pb1">
        <dt class="mb0 t12 w700">
          VALOR LIQUIDADO TOTAL:
        </dt>
        <dd class="mb0 t48 w700 liquidado">
          R$ {{ dinheiro(Number(liquidadoTotal)) }}
        </dd>
      </div>
    </dl>
  </CardEnvelope.Conteudo>
</template>

<style scoped lang="less">
    p{
        color: #7E858D;
    }

    dd{
        white-space: nowrap;
    }

    .liquidado {
        color: #D86B2C;
    }
</style>

<script setup>
import { defineProps } from 'vue';
import { dinheiroSemCentavos } from '@/helpers/dinheiro';
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
      <div class="pb1 flex column end">
        <dt class="mb0 t12 w700 uc">
          Custo planejado total:
        </dt>
        <dd class="mb0 t36 w700">
          R$ {{ dinheiroSemCentavos(Number(planejadoTotal)) }}
        </dd>
      </div>
      <div class="pb1 flex column end">
        <dt class="mb0 t12 w700 uc">
          Valor empenhado total:
        </dt>
        <dd class="mb0 t36 w700">
          R$ {{ dinheiroSemCentavos(Number(empenhoTotal)) }}
        </dd>
      </div>
      <div class="pb1 flex column end">
        <dt class="mb0 t12 w700 uc">
          Valor liquidado total:
        </dt>
        <dd class="mb0 t36 w700 liquidado">
          R$ {{ dinheiroSemCentavos(Number(liquidadoTotal)) }}
        </dd>
      </div>
    </dl>
  </CardEnvelope.Conteudo>
</template>

<style scoped lang="less">
    dt{
        color: #7E858D;
    }

    dd {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .liquidado {
        color: #D86B2C;
    }
</style>

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
  <dl class="tr mt3 w700">
    <div class="pb1 flex column end">
      <dt class="mb0 t12 w700 uc">
        Custo planejado total:
      </dt>
      <dd class="mb0 t36 w700">
        R$ {{ dinheiro(Number(planejadoTotal),true) }}
      </dd>
    </div>
    <div class="pb1 flex column end">
      <dt class="mb0 t12 w700 uc">
        Valor empenhado total:
      </dt>
      <dd class="mb0 t36 w700">
        R$ {{ dinheiro(Number(empenhoTotal), true) }}
      </dd>
    </div>
    <div class="pb1 flex column end">
      <dt class="mb0 t12 w700 uc">
        Valor liquidado total:
      </dt>
      <dd class="mb0 t36 w700 liquidado">
        R$ {{ dinheiro(Number(liquidadoTotal), true) }}
      </dd>
    </div>
  </dl>
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

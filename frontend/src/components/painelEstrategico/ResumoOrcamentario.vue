<script setup>
import { defineProps } from 'vue';
import dinheiro from '@/helpers/dinheiro';

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
        R$ {{ dinheiro(Number(planejadoTotal)) }}
      </dd>
    </div>
    <div class="pb1 flex column end">
      <dt class="mb0 t12 w700 uc">
        Valor empenhado total:
      </dt>
      <dd class="mb0 t36 w700">
        R$ {{ dinheiro(Number(empenhoTotal)) }}
      </dd>
    </div>
    <div class="pb1 flex column end">
      <dt class="mb0 t12 w700 uc">
        Valor liquidado total:
      </dt>
      <dd class="mb0 t36 w700 liquidado">
        R$ {{ dinheiro(Number(liquidadoTotal)) }}
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
      font-family: "Roboto Slab", serif;
    }

    .liquidado {
      color: #D86B2C;
    }
</style>

<script setup>
import { defineProps } from 'vue';
import dinheiro from '@/helpers/dinheiro';
import AnimatedNumber from '@/components/AnimatedNumber.vue';

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
      <AnimatedNumber
        :value="Number(planejadoTotal)"
        as="dd"
        :formatter="dinheiro"
        slowness="2"
        class="mb0 t36 w700"
      >
        <template #prefix>
          <span class="ff-regular">R$</span>
        </template>
      </AnimatedNumber>
    </div>
    <div class="pb1 flex column end">
      <dt class="mb0 t12 w700 uc">
        Valor empenhado total:
      </dt>
      <AnimatedNumber
        :value="Number(empenhoTotal)"
        as="dd"
        :formatter="dinheiro"
        slowness="2"
        class="mb0 t36 w700"
      >
        <template #prefix>
          <span class="ff-regular">R$</span>
        </template>
      </AnimatedNumber>
    </div>
    <div class="pb1 flex column end">
      <dt class="mb0 t12 w700 uc">
        Valor liquidado total:
      </dt>
      <AnimatedNumber
        :value="Number(liquidadoTotal)"
        as="dd"
        :formatter="dinheiro"
        slowness="2"
        class="mb0 t36 w700 liquidado"
      >
        <template #prefix>
          <span class="ff-regular">R$</span>
        </template>
      </AnimatedNumber>
    </div>
  </dl>
</template>

<style scoped lang="less">
    dl {
      container-type: inline-size;
    }
    dt {
      color: #7E858D;
    }

    dd {
      padding: 0 0.1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      font-family: "Roboto Mono", monospace;
      letter-spacing: -0.1em;
      overflow-wrap: anywhere;
      font-size: clamp(1rem, 10cqi, 3rem);
    }

    .liquidado {
      color: #D86B2C;
    }
</style>

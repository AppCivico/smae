<script setup>
import { dateToDay, dateToMonth } from '@/helpers/dateToDate';

defineProps({
  pdm: {
    type: Object,
    required: true,
  },
});
</script>
<template>
  <template v-if="Array.isArray(pdm?.ciclo_fisico_ativo?.fases)">
    <h2 class="w400 t20 tc tamarelo calendario__titulo mb1">
      {{ dateToMonth(pdm?.ciclo_fisico_ativo.data_ciclo, 'long') }}
    </h2>

    <dl class="calendario__lista">
      <div
        v-for="fase in
          pdm.ciclo_fisico_ativo.fases "
        :key="fase.id"
        class="flex calendario__item center mb1"
        :class="{ 'calendario__item--destaque': fase.fase_corrente }"
      >
        <dt class="f1 t20 tamarelo calendario__intervalo">
          <span
            class="calendario__dia"
            :class="{
              'calendario__dia--foraDoMês':
                dateToMonth(fase.data_inicio) !== dateToMonth(pdm?.ciclo_fisico_ativo.data_ciclo)
            }"
          >
            {{ dateToDay(fase.data_inicio, '2-digit') }}
          </span> &ndash; <span
            class="calendario__dia"
            :class="{
              'calendario__dia--foraDoMês':
                dateToMonth(fase.data_fim) !== dateToMonth(pdm?.ciclo_fisico_ativo.data_ciclo)
            }"
          >
            {{ dateToDay(fase.data_fim, '2-digit') }}
          </span>
        </dt>
        <dd class="f2 t12 w700 tprimary calendario__evento">
          {{ fase.ciclo_fase }}
        </dd>
      </div>
    </dl>
  </template>
</template>
<style lang="less">
.calendario__titulo {
  text-transform: capitalize;
}

.calendario__dia--foraDoMês {
  color: fuchsia;
}

.calendario__intervalo {
  font-variant-numeric: tabular-nums;
}
</style>

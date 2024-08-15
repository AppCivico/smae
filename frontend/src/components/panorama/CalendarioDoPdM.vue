<script setup>
import { dateToDay, dateToMonth } from '@/helpers/dateToDate';

defineProps({
  pdm: {
    type: Object,
    required: true,
  },
  perfil: {
    type: String,
    default: 'PdM',
    validator(valor) {
      return [
        'admin_cp',
        'ponto_focal',
        'tecnico_cp',
      ].indexOf(valor) > -1;
    },
  },
});
</script>
<template>
  <div
    v-if="Array.isArray(pdm?.ciclo_fisico_ativo?.fases)"
    class="calendario"
  >
    <h2 class="w400 t20 tc tamarelo calendario__titulo mb1">
      {{ dateToMonth(pdm?.ciclo_fisico_ativo.data_ciclo, 'long') }}
    </h2>

    <dl class="calendario__lista">
      <template
        v-for="fase in pdm.ciclo_fisico_ativo.fases "
        :key="fase.id"
      >
        <div
          v-if="perfil !== 'ponto_focal' || fase.ciclo_fase === 'Coleta'"
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
            {{ fase.ciclo_fase === 'Analise' ? 'Análise' : fase.ciclo_fase }}
          </dd>
        </div>
      </template>
    </dl>
  </div>
</template>
<style lang="less" scoped>
.calendario {}

.calendario__titulo {
  border-bottom: 1px solid @c200;
  margin-bottom: 1rem;
  padding-bottom: 1rem;
  text-transform: capitalize;
}

.calendario__lista {}

.calendario__item {}

.calendario__item--destaque {
  border-radius: 4px;
  outline: 1px solid @amarelo;
  outline-offset: 8px;
}

.calendario__intervalo {
  display: flex;
  white-space: nowrap;
  font-variant-numeric: tabular-nums;

  &:after {
    content: '';
    display: block;
    flex-grow: 1;
    border-bottom: 1px solid @c100;
    height: 0;
    margin-top: auto;
    margin-bottom: auto;
    margin-left: 1rem;
  }
}

.calendario__evento {
  display: flex;

  &:before {
    content: '';
    display: block;
    flex-grow: 1;
    border-bottom: 1px solid @c100;
    height: 0;
    margin-top: auto;
    margin-right: 1rem;
    margin-bottom: auto;
  }
}

.calendario__dia--foraDoMês {
  color: @c300;
}
</style>

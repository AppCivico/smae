<template>
  <div
    class="barra-de-progresso flex g05"
    :style="{
      '--progresso': progressoCalculado+'%'
    }"
  >
    <span class="barra-de-progresso__barra" />

    <span
      v-if="exibirNumero"
      class="barra-de-progresso__valor"
    >
      {{ progressoCalculado }}%
    </span>
  </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';

type Props = {
  exibirNumero?: boolean,
  total: number
  atual: number
};

const props = withDefaults(defineProps<Props>(), {
  exibirNumero: true,
});

const progressoCalculado = computed<string>(() => {
  const progresso = (props.atual / props.total) * 100;

  return progresso.toFixed(0);
});

</script>

<style lang="less" scoped>
.barra-de-progresso {
  height: 1rem;
  width: 100%;
}

.barra-de-progresso__barra {
  width: 100%;
  height: 100%;
  position: relative;
  background-color: #D9D9D9;
  overflow: hidden;
  flex-grow: 1;

  &::before {
    content: '';
    width: var(--progresso);
    height: 100%;
    position: absolute;
    background-color: #005C8A;
  }
}

.barra-de-progresso__valor {
  min-width: 34px;
}
</style>

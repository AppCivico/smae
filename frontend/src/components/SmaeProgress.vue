<template>
  <div
    class="smae-progress flex g05"
    :style="{
      '--progresso': progressoCalculado+'%'
    }"
  >
    <span class="smae-progress__barra" />

    <span
      v-if="exibirNumero"
      class="smae-progress__valor"
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
.smae-progress {
  height: 1rem;
  width: 100%;
}

.smae-progress__barra {
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

.smae-progress__valor {
  min-width: 34px;
}
</style>

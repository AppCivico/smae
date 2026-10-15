<script lang="ts" setup>
type Props = {
  numero?: number | null;
};

defineProps<Props>();
</script>

<template>
  <svg
    class="icone-fase-monitoramento"
    viewBox="0 0 16 16"
    aria-hidden="true"
  >
    <use xlink:href="#i_ciclo_fase" />
    <text
      v-if="$props.numero"
      x="8"
      y="8.4"
      text-anchor="middle"
      dominant-baseline="central"
      fill="currentColor"
      class="icone-fase-monitoramento__numero"
    >{{ $props.numero }}</text>
  </svg>
</template>

<style lang="less" scoped>
.icone-fase-monitoramento {
  width: 100%;
  height: 100%;
}

.icone-fase-monitoramento__numero {
  font-size: 8px;
  font-weight: 500;
}
</style>

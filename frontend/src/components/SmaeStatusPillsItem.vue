<script lang="ts" setup>
type Emits = {
  click: [];
};

type Props = {
  label?: string;
  cor: string;
  ativo?: boolean;
};

defineEmits<Emits>();
withDefaults(defineProps<Props>(), {
  label: '',
  ativo: false,
});

</script>

<template>
  <button
    type="button"
    class="status-pill"
    :class="{ 'status-pill--ativo': ativo }"
    :style="{
      '--pill-cor': cor,
    }"
    :aria-pressed="ativo"
    @click="$emit('click')"
  >
    <slot>
      {{ label }}
    </slot>
  </button>
</template>

<style lang="less" scoped>
.status-pill {
  padding: 0 8px;
  border: 1px solid var(--pill-cor);
  border-radius: 4px;
  background: transparent;
  color: var(--pill-cor);
  font-size: 14px;
  font-weight: 400;
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s, opacity 0.2s;
  white-space: nowrap;
  line-height: 1.4;
  opacity: 0.6;

  &:hover {
    opacity: 0.85;
    background-color: color-mix(in srgb, var(--pill-cor) 8%, transparent);
  }

  &--ativo {
    opacity: 1;
    background-color: color-mix(in srgb, var(--pill-cor) 15%, transparent);
    font-weight: 600;
  }
}
</style>

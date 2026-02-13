<script lang="ts" setup>
import { computed } from 'vue';

export interface StatusPillItem {
  valor: string;
  label: string;
  cor: string;
}

const props = withDefaults(defineProps<{
  items: StatusPillItem[];
  modelValue: string | string[];
  multiplo?: boolean;
}>(), {
  multiplo: false,
});

const emit = defineEmits<{
  'update:modelValue': [valor: string | string[]];
}>();

const selecionados = computed<string[]>(() => {
  if (Array.isArray(props.modelValue)) {
    return props.modelValue;
  }
  return props.modelValue ? [props.modelValue] : [];
});

function estaSelecionado(valor: string): boolean {
  return selecionados.value.includes(valor);
}

function alternar(valor: string) {
  if (props.multiplo) {
    const novos = estaSelecionado(valor)
      ? selecionados.value.filter((v) => v !== valor)
      : [...selecionados.value, valor];
    emit('update:modelValue', novos);
  } else {
    emit('update:modelValue', estaSelecionado(valor) ? '' : valor);
  }
}
</script>

<template>
  <div
    class="status-pills"
    role="group"
  >
    <button
      v-for="item in items"
      :key="item.valor"
      type="button"
      class="status-pill"
      :class="{ 'status-pill--ativo': estaSelecionado(item.valor) }"
      :style="{
        '--pill-cor': item.cor,
      }"
      :aria-pressed="estaSelecionado(item.valor)"
      @click="alternar(item.valor)"
    >
      {{ item.label }}
    </button>
  </div>
</template>

<style lang="less" scoped>
.status-pills {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  align-items: center;
}

.status-pill {
  padding: 6px 16px;
  border: 1.5px solid var(--pill-cor);
  border-radius: 20px;
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
